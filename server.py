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

client = OpenAI()

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

        response = client.responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        { "type": "input_text", "text": "Given this image of a component, return only the matching component name. Output only the name of the component, and if it is an IC whether or not it is on a shield or not. If it is not a component, respond with 'null'. The specific component is needed, or if it is an IC, just respond with 'IC': " },
                        {
                            "type": "input_image",
                            "image_url": url_param,
                        }
                    ]
                }
            ]
        )

        print(response)
        results = response.json().output.content.text
        print(results)

        return results.json()

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def check_name(titles):
    return {"component_name": titles[0] if titles else "Unknown"}

#@app.route('/check-ai', methods=['POST'])
#def check_ai():
#    try:
#        data = request.json
#        prompt = data.get('prompt')
#
#        response = client.models.generate_content(
#            model="gemini-2.0-flash",
#            contents=prompt,
#            config=config,
#        )

#        if response.candidates[0].content.parts[0].function_call:
#            function_call = response.candidates[0].content.parts[0].function_call
#            print(f"Function to call: {function_call.name}")
#            print(f"Arguments: {function_call.args}")

#            result = check_name(**function_call.args)
#            return jsonify(result)

#        else:
#            print("No function call found in the response.")
#            return jsonify({"message": "No function call found in Gemini response."})

#    except Exception as e:
#        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
