var mndFileds = new Array(
  "First\x20Name",
  "Last\x20Name",
  "Accounts.Account\x20Name",
  "Email",
  "Mobile",
  "CONTACTCF6"
);
var fldLangVal = new Array(
  "First Name",
  "Last Name",
  "Patient Name",
  "Email",
  "Mobile",
  "Message"
);
var wfInnerWidth = window.innerWidth;
if (wfInnerWidth <= 768) {
  document.forms["BiginWebToRecordForm654367000000315545"].setAttribute(
    "data-ux-form-alignment",
    "top"
  );
}
var name = "";
var email = "";
function removeError(fieldObj) {
  var parentElement = fieldObj.parentElement.parentElement,
    childEle = parentElement.getElementsByClassName("wf-field-error")[0];
  if (childEle) {
    parentElement.classList.remove("wf-field-error-active");
    parentElement.removeChild(
      parentElement.getElementsByClassName("wf-field-error")[0]
    );
  }
}
function setError(fieldObj, label) {
  var parentElement = fieldObj.parentElement.parentElement,
    childEle = parentElement.getElementsByClassName("wf-field-error")[0];
  if (!childEle) {
    var spanEle = document.createElement("SPAN");
    spanEle.setAttribute("class", "wf-field-error");
    spanEle.innerHTML = label;
    parentElement.append(spanEle);
    parentElement.classList.add("wf-field-error-active");
  }
}
function validateFields654367000000315545() {
  var isReturn = true;
  var form = document.forms["BiginWebToRecordForm654367000000315545"];
  var validateFld = form.querySelectorAll("[fvalidate=true]");
  var i;
  for (i = 0; i < validateFld.length; i++) {
    var validateFldVal = validateFld[i].value;
    if (validateFldVal !== "") {
      var fLabel =
        validateFld[
          i
        ].parentElement.parentElement.parentElement.getElementsByClassName(
          "wf-label"
        )[0].innerHTML;
      switch (validateFld[i].getAttribute("ftype")) {
        case "email":
          if (
            validateFldVal.match(
              /^([A-Za-z0-9-._%'+/]+@[A-Za-z0-9.-]+.[a-zA-Z]{2,22})$/
            ) === null
          ) {
            setError(validateFld[i], "Enter valid " + fLabel);
            isReturn = false;
          }
          break;
        case "number":
          if (validateFldVal.match(/^[0-9]+$/) === null) {
            setError(validateFld[i], "Enter valid " + fLabel);
            isReturn = false;
          }
          break;
        case "double":
          if (validateFldVal.match(/^[0-9]*(\.[0-9]{0,2})?$/) === null) {
            setError(validateFld[i], "Enter valid " + fLabel);
            isReturn = false;
          }
          break;
        case "mobile":
          if (validateFldVal.match(/^[0-9a-zA-Z+.()\-;\s]+$/) === null) {
            setError(validateFld[i], "Enter valid " + fLabel);
            isReturn = false;
          }
          break;
      }
    }
  }
  return isReturn;
}
function privacyError654367000000315545() {
  var privacyTool = document.getElementById("privacycheck654367000000315545");
  if (privacyTool != undefined && !privacyTool.checked) {
    setError(privacyTool, "Please accept Privacy Policy");
    return false;
  }
  return true;
}
function disablePrivacyError654367000000315545() {
  var privacyTool = document.getElementById("privacycheck654367000000315545");
  removeError(privacyTool);
}

function checkMandatory654367000000315545() {
  var isReturn = true;
  for (i = 0; i < mndFileds.length; i++) {
    var fieldObj =
      document.forms["BiginWebToRecordForm654367000000315545"][mndFileds[i]];
    if (fieldObj) {
      if (fieldObj.value.replace(/^\s+|\s+$/g, "").length == 0) {
        if (fieldObj.type == "file") {
          setError(fieldObj, "Please select a file to upload.");
          isReturn = false;
        }
        setError(fieldObj, fldLangVal[i] + " cannot be empty");
        isReturn = false;
      } else if (fieldObj.nodeName == "SELECT") {
        if (fieldObj.options[fieldObj.selectedIndex].value == "-None-") {
          setError(fieldObj, fldLangVal[i] + " cannot be none.");
          isReturn = false;
        }
      } else if (fieldObj.type == "checkbox") {
        if (fieldObj.checked == false) {
          setError(fieldObj, "Please accept  " + fldLangVal[i]);
          isReturn = false;
        }
      }
    }
  }
  if (!privacyError654367000000315545()) {
    isReturn = false;
  }
  if (!validateFields654367000000315545()) {
    isReturn = false;
  }
  if (!isReturn) {
    var errEle = document.getElementsByClassName("wf-field-error");
    if (errEle && errEle.length > 0) {
      var inputEle = errEle[0].parentElement.getElementsByTagName("input");
      if (inputEle && inputEle.length == 0) {
        inputEle = errEle[0].parentElement.getElementsByTagName("select");
      }
      if (inputEle && inputEle.length > 0) {
        inputEle[0].focus();
      }
    }
  }
  return isReturn;
}

document
  .getElementById("hidden654367000000315545Frame")
  .addEventListener("load", function () {
    try {
      var doc = arguments[0].currentTarget.contentWindow.document;
      if (doc.body.childElementCount !== 0) {
        arguments[0].currentTarget.style.display = "block";
        document.getElementById(
          "BiginWebToRecordForm1000000105005"
        ).style.display = "none";
      }
    } catch (error) {
      arguments[0].currentTarget.style.display = "block";
      document.getElementById(
        "BiginWebToRecordForm654367000000315545"
      ).style.display = "none";
    }
  });
