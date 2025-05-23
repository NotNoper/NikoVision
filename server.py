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
        data = request.get_json(force=True)
        img_base64 = data.get('imageBase64', '').split(",")[1]
        img_bytes = base64.b64decode(img_base64)

        img_base64_encoded = base64.b64encode(img_bytes).decode('utf-8')

        payload = {
            "requests": [
                {
                    "image": {
                        "content": img_base64_encoded
                    },
                    "features": [
                        {
                            "type": "IMAGE_PROPERTIES"
                        }
                    ]
                }
            ]
        }

        response = requests.post(
            f"https://vision.googleapis.com/v1/images:annotate?key={client}",
            json=payload
        )

        response_data = response.json()

        similar_images = []
        for result in response_data["responses"][0]["imagePropertiesAnnotation"]["dominantColors"]:
            similar_images.append(result["color"])

        return jsonify({"type": "visual_matches", "results": similar_images})

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
