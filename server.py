import cv2
from ultralytics import YOLO
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import requests
import os
<<<<<<< HEAD
import uuid
from openai import OpenAI
from inference_sdk import InferenceHTTPClient
=======
from google import genai
from google.genai import types
>>>>>>> parent of 92ee283 (changed to ChatGPT API)

load_dotenv()

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

SERPAPI_API_KEY = os.getenv('SERPAPI_API_KEY')

STATIC_FOLDER = os.path.join(os.getcwd(), "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

<<<<<<< HEAD
#client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")


@app.route('/capture-components', methods=['GET'])
def capture_components():
    try:
        model = YOLO("best.pt")
        cap = cv2.VideoCapture(0)

        ret, frame = cap.read()
        cap.release()

        if not ret:
            return jsonify({'error': 'Could not capture image from webcam'}), 500

        results = model(frame)[0]
        boxes = results.boxes.xyxy.cpu().numpy().astype(int)

        saved_images = []
        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = box
            cropped = frame[y1:y2, x1:x2]

            filename = f"{uuid.uuid4().hex}.png"
            filepath = os.path.join(STATIC_FOLDER, filename)
            cv2.imwrite(filepath, cropped)
            saved_images.append(f"/static/{filename}")

        annotated_filename = f"{uuid.uuid4().hex}_annotated.png"
        annotated_path = os.path.join(STATIC_FOLDER, annotated_filename)
        annotated_frame = results.plot()
        cv2.imwrite(annotated_path, annotated_frame)

        return jsonify({
            'cropped_images': saved_images,
            'annotated_image': f"/static/{annotated_filename}"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
=======
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
>>>>>>> parent of 92ee283 (changed to ChatGPT API)


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

<<<<<<< HEAD
        client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY
        )

        result = client.run_workflow(
            workspace_name="ai-bewl6",
            workflow_id="small-object-detection-sahi",
            images={"image": url_param},
            use_cache=False
        )

        print(result)

        return result.json()

        #response = client.responses.create(
        #    model="gpt-4.1",
        #    input=[
        #        {
        #            "role": "user",
        #            "content": [
        #                { "type": "input_text", "text": "Given this image of a component, return only the matching component name. Output only the name of the component, and if it is an IC whether or not it is on a shield or not. If it is not a component, respond with 'null'. The specific component is needed, or if it is an IC, just respond with 'IC': " },
        #                {
        #                    "type": "input_image",
        #                    "image_url": url_param,
        #                }
        #            ]
        #        }
        #    ]
        #)

        #print(response)
        #results = response.json().output.content.text
        #print(results)

        #return results.json()
=======
        params = {
            "engine": "google_reverse_image",
            "image_url": url_param,
            "api_key": SERPAPI_API_KEY,
            "no_cache": True
        }

        response = requests.get("https://serpapi.com/search", params=params)
        results = response.json()

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
>>>>>>> parent of 92ee283 (changed to ChatGPT API)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def check_name(titles):
    return {"component_name": titles[0] if titles else "Unknown"}

<<<<<<< HEAD
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
#
#        if response.candidates[0].content.parts[0].function_call:
#            function_call = response.candidates[0].content.parts[0].function_call
#            print(f"Function to call: {function_call.name}")
#            print(f"Arguments: {function_call.args}")
#
#            result = check_name(**function_call.args)
#            return jsonify(result)
#
#        else:
#            print("No function call found in the response.")
#            return jsonify({"message": "No function call found in Gemini response."})
#
#    except Exception as e:
#        return jsonify({'error': str(e)}), 500
=======

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
>>>>>>> parent of 92ee283 (changed to ChatGPT API)

if __name__ == '__main__':
    app.run(debug=True)