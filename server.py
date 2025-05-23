from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import requests
import os
from google import genai
from google.genai import types

load_dotenv() 

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app) 

SERPAPI_API_KEY = os.getenv('SERPAPI_API_KEY')

STATIC_FOLDER = os.path.join(os.getcwd(), "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

check_name = {
    "name": "check_name",
    "description": "Gets the name of a component based on titles.",
    "parameters": {
        "type": "object",
        "properties": {
            "titles": {
                "type": "array",
                "items": { "type": "string" },
                "description": "The list of possible names",
            },

        },
        "required": ["titles"],
    },
}


client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
tools = types.Tool(function_declarations=[check_name])
config = types.GenerateContentConfig(tools=[tools])


@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.json
        img_base64 = data.get('imageBase64').split(",")[1]
        img_bytes = base64.b64decode(img_base64)

        filename = "image.png"
        filepath = os.path.join(STATIC_FOLDER, filename)
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        #url_param = 'http://127.0.0.1:5000/static/{filename}'
        url_param = 'https://nikovision.onrender.com/static/z.png'

        params = {
            "engine": "google_reverse_image",
            "image_url": url_param,
            "api_key": SERPAPI_API_KEY
        }

        search = requests.get("https://serpapi.com/search", params=params)
        results = search.json()
        print("Full API Response:", results) 

        inline_images = results.get("inline_images", None)

        if inline_images is None:
            return jsonify({'error': "'inline_images' key not found in API response", 'full_response': results})

        return jsonify(inline_images)


    except Exception as e:
        return jsonify({'error': str(e)}), 500



def check_name(titles):
    return {"component_name": titles[0] if titles else "Unknown"}


@app.route('/check-ai', methods=['POST'])
def check_ai():
    try:
        data = request.json
        prompt = data.get('prompt')

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=config,
        )

        if response.candidates[0].content.parts[0].function_call:
            function_call = response.candidates[0].content.parts[0].function_call
            print(f"Function to call: {function_call.name}")
            print(f"Arguments: {function_call.args}")

            result = check_name(**function_call.args)
            return jsonify(result)

        else:
            print("No function call found in the response.")
            return jsonify({"message": "No function call found in Gemini response."})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
