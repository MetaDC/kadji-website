// Variables for form elements
const downloadPdf = document.querySelector("#continuecal");
const submitForm = document.querySelector("#submit-form");
const modal = document.querySelector("#deck");
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const pleaseFillMessage = document.getElementById('pleasefill');
const dailyResult = document.getElementById('daily-result');
const reDailyResult = document.getElementById('re-daily-result');
let pop_once = true;

// Validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{10}$/; // Modify if a different phone format is needed

// Function to validate form inputs
function validateForm() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !emailPattern.test(email) || !phonePattern.test(phone)) {
        return false; // Invalid if any field is empty or does not match pattern
    }
    return true; // Valid if all checks pass
}

// Handle "Calculate" button click
downloadPdf.addEventListener("click", () => {
    if (validateForm()) {
        pleaseFillMessage.innerText = ""; // Clear any previous error message
        pop_once = false;
        $('#deck').modal('hide'); // Close the modal if form is valid
        submitForm.click(); // Trigger hidden submit button
        cal(); // Call the calculation function
    } else {
        pleaseFillMessage.innerText = "Please fill the form with valid details to get the price";
    }
});

// Form submission handler
document.getElementById("contactForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateForm()) {
        pleaseFillMessage.innerText = "Please fill out all fields with valid details.";
        return;
    }

    const formData = new FormData(event.target);

    try {
        const response = await fetch("https://formsubmit.co/ajax/info@kadji.co.in", {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            event.target.reset(); // Clear form
        } else {
            pleaseFillMessage.innerText = "An error occurred. Please try again.";
        }
    } catch (error) {
        pleaseFillMessage.innerText = "An error occurred. Please try again.";
        console.error("Error:", error);
    }
});

// Care type stay type
document.getElementById("care").onchange = function () { myFunction() };

function myFunction() {
    const careElement = document.getElementById("care");

    if (careElement.value === 'Supervised Care') {
        document.querySelector('#sustay').disabled = false;
        document.querySelector('#spstay').disabled = true;
        document.querySelector('#sustay').style.display = 'block';
        document.querySelector('#spstay').style.display = 'none';
    } else if (careElement.value === 'Specialised Care') {
        document.querySelector('#spstay').disabled = false;
        document.querySelector('#sustay').disabled = true;
        document.querySelector('#spstay').style.display = 'block';
        document.querySelector('#sustay').style.display = 'none';
    } else {
        document.querySelector('#spstay').disabled = true;
        document.querySelector('#sustay').disabled = true;
        document.querySelector('#spstay').style.display = 'none';
        document.querySelector('#sustay').style.display = 'block';
    }
}

// Rehab service type
document.getElementById("re-services").onchange = function () { myFunctionRehab() };

function myFunctionRehab() {
    const rehabServiceElement = document.getElementById("re-services");
    const neuro = document.querySelector('#restayneuro');
    const stroke = document.querySelector('#re-stay-stroke');
    const postOp = document.querySelector('#re-stay-post-op');

    if (rehabServiceElement.value === 'neuro') {
        neuro.disabled = false;
        stroke.disabled = true;
        postOp.disabled = true;
        neuro.style.display = 'block';
        stroke.style.display = 'none';
        postOp.style.display = 'none';
    } else if (rehabServiceElement.value === 'stroke') {
        neuro.disabled = true;
        stroke.disabled = false;
        postOp.disabled = true;
        neuro.style.display = 'none';
        stroke.style.display = 'block';
        postOp.style.display = 'none';
    } else if (rehabServiceElement.value === 'post-operative') {
        neuro.disabled = true;
        stroke.disabled = true;
        postOp.disabled = false;
        neuro.style.display = 'none';
        stroke.style.display = 'none';
        postOp.style.display = 'block';
    } else {
        neuro.disabled = true;
        stroke.disabled = true;
        postOp.disabled = true;
        neuro.style.display = 'block';
        stroke.style.display = 'none';
        postOp.style.display = 'none';
    }
}

// Function to open modal and handle calculation logic
function openModal() {
    // Get values from dropdowns
    const careValue = document.getElementById("care").value;
    const sustayValue = document.getElementById("sustay").value;
    const spstayValue = document.getElementById("spstay").value;

    const reServiceValue = document.getElementById("re-services").value;
    const neuroValue = document.getElementById("restayneuro").value;
    const strokeValue = document.getElementById("re-stay-stroke").value;
    const postOpValue = document.getElementById("re-stay-post-op").value;

    // Initialize completion flags for Care and Rehab
    let isCareComplete = false;
    let isRehabComplete = false;

    // Check if "Care" section is fully completed
    if (careValue === 'Supervised Care' && sustayValue !== 'none') {
        isCareComplete = true;
    } else if (careValue === 'Specialised Care' && spstayValue !== 'none') {
        isCareComplete = true;
    }

    // Check if "Rehab" section is fully completed
    if (reServiceValue === 'neuro' && neuroValue !== 'none') {
        isRehabComplete = true;
    } else if (reServiceValue === 'stroke' && strokeValue !== 'none') {
        isRehabComplete = true;
    } else if (reServiceValue === 'post-operative' && postOpValue !== 'none') {
        isRehabComplete = true;
    }

    // Log the selections to debug
    console.log("Care Value:", careValue);
    console.log("Stay Value (Supervised):", sustayValue);
    console.log("Stay Value (Specialised):", spstayValue);
    console.log("Rehab Service Value:", reServiceValue);
    console.log("Neuro Value:", neuroValue);
    console.log("Stroke Value:", strokeValue);
    console.log("Post-Op Value:", postOpValue);
    console.log("isCareComplete:", isCareComplete);
    console.log("isRehabComplete:", isRehabComplete);

    // Only open the modal if either "Care" or "Rehab" section is fully completed
    if (isCareComplete || isRehabComplete) {
        document.getElementById('fillcomment').innerHTML = "";
        if (!pop_once) {
            cal(); // Calculate directly if the form has been filled before
        } else {
            $('#deck').modal('show'); // Open the modal for form completion
        }
    } else {
        // Show error message if neither Care nor Rehab section is complete
        document.getElementById('fillcomment').innerHTML = "Please select from all the categories above.";
    }
}




// Calculation function
function cal() {
    const care = document.querySelector('#care').value;
    let stay;

    if (care === 'Supervised Care') {
        stay = document.querySelector('#sustay').value;
    } else {
        stay = document.querySelector('#spstay').value;
    }

    if (care !== 'none' && stay !== 'none') {
        const result = parseFloat(stay);
        dailyResult.innerHTML = `Your total cost will be ₹${result}!`;
        document.querySelector('#call').style.display = 'block';
    } else {
        dailyResult.innerHTML = "Select 1 from each category!";
    }

    const reservice = document.querySelector('#re-services').value;
    let restay;

    if (reservice === 'neuro') {
        restay = document.querySelector('#restayneuro').value;
    } else if (reservice === 'stroke') {
        restay = document.querySelector('#re-stay-stroke').value;
    } else if (reservice === 'post-operative') {
        restay = document.querySelector('#re-stay-post-op').value;
    }

    if (reservice !== 'none' && restay !== 'none') {
        const reresult = parseFloat(restay);
        reDailyResult.innerHTML = `Your total cost will be ₹${reresult}!`;
        document.querySelector('#re-call').style.display = 'block';
    } else {
        reDailyResult.innerHTML = "Select 1 from each category!";
    }
}



