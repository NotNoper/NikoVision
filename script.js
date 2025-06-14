const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

var components = [];

async function FindPart(imgBase64) {
    try {
        const response = await fetch('https://nikovision.onrender.com/upload-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageBase64: imgBase64 }) 
        });

        const result = await response.json();
        console.log('Component detected:', result);
        
        document.getElementById('camera').style.display = "block";
        canvas.style.display = "none";
        Array.from(document.getElementsByClassName('container')).forEach(element => {
            element.style.display = "none";
        });

        AddComponent(result);

    } catch (error) {
        console.error('Error during image upload:', error);
    }
}



function Capture() {
    const video = document.getElementById('camera');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    video.style.display = "none";
    canvas.style.display = "block";
    Array.from(document.getElementsByClassName('container')).forEach(element => {
        element.style.display = "block";
    });

    const dataURL = canvas.toDataURL('image/png');
    FindPart(dataURL);
}

const formContainer = document.getElementById('componentListContainer');

function AddComponent(knownComponent = null) {
    const container = document.createElement('div');
    container.className = 'componentList';

    const selectComponent = document.createElement('select');
    selectComponent.innerHTML = `
        <option value="">Select component</option>
        <option value="Microcontroller">Microcontroller</option>
        <option value="IC">IC</option>
        <option value="LED">LED</option>
        <option value="Resistor">Resistor</option>
        <option value="Diode">Diode</option>
        <option value="Transistor">Transistor</option>

        <option value="Battery">Battery</option>
        <option value="Relay">Relay</option>
        <option value="Capacitor">Capacitor</option>
        <option value="Potentiometer">Potentiometer</option>
        <option value="Buzzer">Buzzer</option>
        <option value="Accelerometer">Accelerometer</option>
        <option value="Gyroscope">Gyroscope</option>
    `;
    
    container.appendChild(selectComponent);

    const detailsDiv = document.createElement('div');
    container.appendChild(detailsDiv);

    selectComponent.addEventListener('change', () => {
        detailsDiv.innerHTML = '';
        const selected = selectComponent.value;
        console.log(selected);
        if (selected === "Microcontroller" || selected === 'IC' || selected === 'Battery' || selected === 'Accelerometer' || selected === 'Gyroscope' || selected === 'Transistor' || selected === 'Diode' || selected === 'Relay' || selected === 'Capacitor') {
            const label = document.createElement('label');
            label.textContent = 'Model: ';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Enter model';
            if(knownComponent)
            {
                input.value = knownComponent.model;
            }
            label.appendChild(input);
            detailsDiv.appendChild(label);
        } 
        else if (selected === 'Resistor' || selected === 'Potentiometer' || selected === 'LED') {
            const info = document.createElement('p');
            info.textContent = 'No additional input needed for this component.';
            detailsDiv.appendChild(info);
        } 
    });
    
    if(knownComponent)
    {
        selectComponent.value = knownComponent.component_name;
        selectComponent.dispatchEvent(new Event('change'));
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.marginTop = "10px";
    deleteButton.onclick = function () {
        formContainer.removeChild(container);
    };
    container.appendChild(deleteButton);

    formContainer.appendChild(container);
}

function GetListData()
{
    if(document.getElementById('projectPrompt').value !== "")
    {
        Array.from(formContainer.children).forEach(componentDiv => {
            const select = componentDiv.querySelector('select');
            const componentType = select?.value;

            const componentData = { type: componentType };

            if (componentType === 'Microcontroller' || componentType === 'IC') {
                const input = componentDiv.querySelector('input');
                if(input.value == "")
                {
                    alert("Please enter a model for the component.");
                    return null;
                }
                componentData.model = input?.value || '';
            } 
            else if (componentType === 'Transistor' || componentType === 'Diode') {
                const input = componentDiv.querySelector('input');
                componentData.model = input?.value || '';
            } 

            components.push(componentData);
        });

        const projectPrompt = document.getElementById('projectPrompt').value;
        CheckWithAI("Using the provided JSON list of components and their exact models, generate a structured JSON object representing the system. DO NOT assume or substitute any component model (e.g., do not use 'Arduino Uno' if the list specifies 'Arduino Mega'). Only use the models exactly as they appear in the JSON input. Output format:{'components': [{'name': 'Component Name','model': 'Exact Model Name from JSON','pins': {'Pin1Label': 'ConnectionTarget','Pin2Label': 'ConnectionTarget',...}},...],'code': '// Generate code here'} Replace the comment with the actual code needed to make the project work. Each component must list its pins and what they connect to using labels from the input or standard electronics terminology. Prioritize wiring that meets the project’s goals, even if not all components are used. If a component is a microcontroller, identify it with 'name': 'Microcontroller'. Here is the project description: " + projectPrompt + ". Here is the list of available components: " + JSON.stringify(components));
    }
    else
    {
        alert("Please enter a project prompt.");
        return null;
    }
}

function RevealCamera()
{
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        const video = document.getElementById('camera');
        video.srcObject = stream;
        video.play();
      })
      .catch(err => console.error('Camera error:', err));

    document.getElementById('camContainer').style.display = "block";
    document.getElementById("reveal").style.display = "none";
}

async function CheckWithAI(prompt)
{
    try {
        Array.from(document.getElementsByClassName('container')).forEach(element => {
            element.style.display = "block";
        });

        const response = await fetch('https://nikovision.onrender.com/check-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();

        const codeResult = document.getElementById('code');
        const wiringContainer = document.getElementById('componentWiringContainer');
        for(let i = 0; i < wiringContainer.children.length; i++)
        {
            wiringContainer.children[i].remove();
        }

        for (let i = 0; i < data.components.length; i++) {
            const selectComponent = document.createElement('table');

            const component = data.components[i];
            for (const key in component) {
                if (key === 'pins') {
                    const pinsObj = component.pins;
                    for (const pinName in pinsObj) {
                        const tr = document.createElement('tr');

                        const tdKey = document.createElement('td');
                        tdKey.textContent = pinName;
                        tr.appendChild(tdKey);

                        const tdValue = document.createElement('td');
                        tdValue.textContent = pinsObj[pinName];
                        tr.appendChild(tdValue);

                        selectComponent.appendChild(tr);
                    }
                }
                else if (key !== 'code') {
                    const tr = document.createElement('tr');

                    const tdKey = document.createElement('td');
                    tdKey.textContent = key;
                    tr.appendChild(tdKey);

                    const tdValue = document.createElement('td');
                    tdValue.textContent = component[key];
                    tr.appendChild(tdValue);

                    selectComponent.appendChild(tr);
                }
            }

            wiringContainer.appendChild(selectComponent);
        }
        codeResult.innerHTML = data.code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        Array.from(document.getElementsByClassName('container')).forEach(element => {
            element.style.display = "none";
        });
    } catch (err) {
      console.error('Error:', err);
      alert(err);
      CheckWithAI(prompt);
    }
}