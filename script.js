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
    `;
    
    container.appendChild(selectComponent);

    const detailsDiv = document.createElement('div');
    container.appendChild(detailsDiv);

    selectComponent.addEventListener('change', () => {
        detailsDiv.innerHTML = '';
        const selected = selectComponent.value;
        if (selected === "Microcontroller" || selected === 'IC') {
            const label = document.createElement('label');
            label.textContent = 'Model (required): ';
            const input = document.createElement('input');
            input.type = 'text';
            input.required = true;
            input.placeholder = 'Enter model';
            if(knownComponent.model)
            {
                input.value = knownComponent.model;
            }
            label.appendChild(input);
            detailsDiv.appendChild(label);
        } 
        else if (selected === 'Transistor' || selected === 'Diode') {
            const label = document.createElement('label');
            label.textContent = `${selected} Model (optional): `;
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Enter ${selected} model (optional)`;
            label.appendChild(input);
            detailsDiv.appendChild(label);
        } 
        else if (selected === 'Resistor') {
            const info = document.createElement('p');
            info.textContent = 'No additional input needed for this component.';
            detailsDiv.appendChild(info);
        } 
        else if (selected === 'LED') {
            const info = document.createElement('p');
            info.textContent = 'No additional input needed for this component.';
            detailsDiv.appendChild(info);
        }
    });
    
    if(knownComponent.component_name !== null)
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
    Array.from(formContainer.children).forEach(componentDiv => {
        const select = componentDiv.querySelector('select');
        const componentType = select?.value;

        const componentData = { type: componentType };

        if (componentType === 'Microcontroller' || componentType === 'IC') {
            const input = componentDiv.querySelector('input');
            if(input.value == "")
            {
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
    CheckWithAI("Using the provided JSON list of components and their models that the user has (you do not have to use all components, just try and focus on them), generate a JSON file structured as follows: Each component (e.g., 'MOSFET') should include its pin mappings in the format 'Pin1': 'pintoconnect', 'Pin2': 'pintoconnect', etc. Additionally, create a 'code' entry containing any necessary code to implement the wiring connections for each component, ensuring the setup meets the specified project goal. This is the JSON format: 'components': [ { 'name': 'Arduino Uno', 'model': 'Uno R3', 'pins': { 'DigitalPin13': 'LED Anode', 'GND': 'LED Cathode'}},{'name': 'LED','model': '5mm Red','pins': {'Anode (Long leg)': 'Arduino DigitalPin13','Cathode (Short leg)': 'Resistor (1)','Cathode Pass-through': 'Arduino GND'}},{'name': 'Resistor (1)','model': '220 Ohm','pins': {'Pin1': 'LED Cathode','Pin2': 'Arduino GND'}}]. If no code is needed, the 'code' entry can be left empty. If the object is a some sort of microcontroller, respond with Microcontroller. Follow the project exactly:\n" + projectPrompt + "\n" + components)
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
        const response = await fetch('https://nikovision.onrender.com/check-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();
        const codeResult = document.getElementById('code');
        const wiringContainer = document.getElementById('componentWiringContainer');
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
        codeResult.textContent = data.code;
    } catch (err) {
      console.error('Error:', err);
      CheckWithAI(prompt);
    }
}