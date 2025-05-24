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
        img_base64_full = data.get('imageBase64', '')
        
        if ',' in img_base64_full:
            img_base64 = img_base64_full.split(",")[1]
        else:
            img_base64 = img_base64_full
        
        response = client.chat.completions.create(
            model="gpt-4o", 
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Given this image of a component, return only the matching component name (e.g., capacitor, led, IC etc.). Output only the name of the component. If it is not a component, respond with 'null': "},
                        {
                            "type": "image_base64",
                            "image_base64": {
                                "base64": img_base64
                            }
                        },
                    ],
                }
            ],
        )

        result = response.choices[0].message.content
        print("OpenAI response:", result)
        return jsonify({"component_name": result.strip()})

    except Exception as e:
        print("Error in upload_image:", e)
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
                {"role": "system", "content": "You are a senior engineer working out the wiring of components for someones project. You only respond in JSON"},
                {"role": "user", "content": prompt}
            ]
        )

        print(response.choices[0].message.content)

        return response.choices[0].message.content

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
