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

        filepath = os.path.join(STATIC_FOLDER, 'image.png')
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        url_param = 'https://nikovision.onrender.com/static/image.png'

        params = {
            "engine": "google_reverse_image",
            "image_url": url_param,
            "api_key": SERPAPI_API_KEY,
            "no_cache": True
        }

        response = requests.get("https://serpapi.com/search", params=params)
        results = response.json()

        if "inline_images" in results:
            return jsonify({"type": "inline_images", "results": results["inline_images"]})

        if "visual_matches" in results:
            return jsonify({"type": "visual_matches", "results": results["visual_matches"]})

        best_guess = results.get("search_metadata", {}).get("best_guess")
        if best_guess:
            text_params = {
                "engine": "google",
                "q": best_guess,
                "api_key": SERPAPI_API_KEY
            }
            text_search = requests.get("https://serpapi.com/search", params=text_params)
            text_results = text_search.json()

            organic_results = text_results.get("organic_results", [])
            return jsonify({
                "type": "best_guess",
                "query": best_guess,
                "results": organic_results
            })

        return jsonify({
            "error": "No recognizable matches found.",
            "serpapi_response": results
        })

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
