from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os
from openai import OpenAI

load_dotenv() 

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app) 

STATIC_FOLDER = os.path.join(os.getcwd(), "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        print("Received request to upload image")
        data = request.get_json(force=True)
        img_data_url = data.get('imageBase64', '')

        if not img_data_url.startswith("data:image"):
            raise ValueError("Invalid image data URL")

        response = client.chat.completions.create(
            model="gpt-4o", 
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Given this image of a component, return only with the matching component name (e.g, capacitor, led, IC etc.) and its model if able. The response should look like this: Microcontroller:Uno R3. If model is unknown, respond 'unknown'. If it is not a component, respond 'null': "},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": img_data_url
                            },
                        },
                    ],
                }
            ],
        )

        result = response.choices[0].message.content.strip()
        print("Result:", result)
        component = result.split(':', 1)
        return jsonify({"component_name": component[0], "model": component[1]})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def check_name(titles):
    return {"component_name": titles[0] if titles else "Unknown"}

@app.route('/check-ai', methods=['POST'])
def CheckAI():
    try:
        data = request.json
        prompt = data.get('prompt')

        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a senior engineer working out the wiring of components for someones project."},
                {"role": "user", "content": prompt}
            ]
        )

        print(response.choices[0].message.content)

        return response.choices[0].message.content

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
