navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.getElementById('camera');
    video.srcObject = stream;
    video.play();
  })
  .catch(err => console.error('Camera error:', err));


const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

async function FindPart(imgBase64) {
    try {
        const response = await fetch('https://srv-d0o14iqli9vc73fi62hg.onrender.com/upload-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64: imgBase64 })
        });

        const result = await response.json();
        console.log(result);

        CheckWithAI("Given a list of website names mentioning a component, return only the matching component name. Only one match is correct, even if others are mentioned. Output only the name of the component, and if it is an IC whether or not it is on a shield or not. If it is not a component, respond with 'null': " + JSON.stringify(result));

    } catch (error) {
        console.error(error);
    }
}

async function CheckWithAI(prompt)
{
    try {
        const response = await fetch('https://srv-d0o14iqli9vc73fi62hg.onrender.com/check-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        console.log(data);
        if(data.result == "Error during authentication for model gpt-4o-mini: Failed to create temporary account. Status: 400, Details: You are not allowed to sign up.")
        {
            console.log("Retrying...");
            CheckWithAI(prompt);
        }
        else if(data.result == "null")
        {
            return;
        }
    } catch (err) {
      console.error('Error:', err);
    }
}

function Capture() {
    const video = document.getElementById('camera');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    video.style.display = "none";
    canvas.style.display = "block";

    const dataURL = canvas.toDataURL('image/png');
    FindPart(dataURL);
}