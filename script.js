navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.getElementById('camera');
    video.srcObject = stream;
    video.play();
  })
  .catch(err => console.error('Camera error:', err));


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
        console.log(result);
        
        //CheckWithAI(JSON.stringify(result));

    } catch (error) {
        console.error(error);
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

const formContainer = document.getElementById('componentListContainer');

function AddComponent() {
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
            const bands = ['Band 1', 'Band 2', 'Band 3', 'Band 4'];
            bands.forEach(band => {
                const label = document.createElement('label');
                label.textContent = `${band}: `;
                const select = document.createElement('select');
                const colors = ['Black', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet', 'Grey', 'White', 'Gold', 'Silver'];
                colors.forEach(color => {
                    const option = document.createElement('option');
                    option.value = color.toLowerCase();
                    option.textContent = color;
                    select.appendChild(option);
                });
                label.appendChild(select);
                detailsDiv.appendChild(label);
                detailsDiv.appendChild(document.createElement('br'));
            });
        } 
        else if (selected === 'LED') {
            const info = document.createElement('p');
            info.textContent = 'No additional input needed for this component.';
            detailsDiv.appendChild(info);
        }
    });

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
    const components = [];

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
        else if (componentType === 'Resistor') {
            const selects = componentDiv.querySelectorAll('select');
            const bandColors = Array.from(selects).slice(1).map(select => select.value); 
            componentData.bands = bandColors;
        }

        components.push(componentData);
    });

    const projectPrompt = document.getElementById('projectPrompt').value;
    //CheckWithAI("Using the provided JSON list of components and their models, generate a JSON file structured as follows: Each component (e.g., 'MOSFET') should include its pin mappings in the format 'Pin1': 'pintoconnect', 'Pin2': 'pintoconnect', etc. Additionally, create a 'code' entry containing any necessary code to implement the wiring connections for each component, ensuring the setup meets the specified project goal:\n" + projectPrompt + "\n" + components)
    CheckWithAI("hey")
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
        const wiringResult = document.getElementById('wiring');
        wiringResult.textContent = data;
        codeResult.textContent = data.code;
    } catch (err) {
      console.error('Error:', err);
    }
}