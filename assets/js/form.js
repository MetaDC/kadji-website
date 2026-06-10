document
  .getElementById("contactForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const button = document.getElementById("continuecal");
    const loader = document.getElementById("btn-loader");
    button.querySelector(".cleenhearts-btn__icon-box").classList.add("d-none");
    button.querySelector(".cleenhearts-btn__text").classList.add("d-none");
    loader.classList.remove("d-none");
    button.disabled = true;

    let name = document.getElementById("contactName").value;
    let phone = document.getElementById("contactPhone").value;
    let email = document.getElementById("email").value;

    const data = {
      emails: ["info@kadji.co.in"],
      // emails: ["matinshaikh79070@gmail.com"],
      subject: "New Pricing Submission",
      message: `<strong>Name</strong> : ${name}<br/> <strong>Phone</strong> : ${phone}<br/> <strong>email</strong> : ${email}<br/>`,
    };
    try {
      const response = await fetch("https://mailer-5x4h33dpla-uc.a.run.app/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const resultText = await response.text();
      console.log(resultText);
      if (response.ok) {
        // alert("Success: Your enquiry has been submitted!");
        document.getElementById("contactForm").reset();
        window.open("pdf.html", "_blank");

        setTimeout(() => {
          closeForm();
        }, 1000);
      } else {
        alert(`Error: ${resultText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      // alert("An error occurred. Please try again later.");
    } finally {
      button
        .querySelector(".cleenhearts-btn__icon-box")
        .classList.remove("d-none");
      button.querySelector(".cleenhearts-btn__text").classList.remove("d-none");
      loader.classList.add("d-none");
      button.disabled = false;
    }

    function closeForm() {
      window.location.href = document.URL;
      return;
      // // document.getElementById("deck").modal("toggle")
      // // $('#deck').modal('toggle');

      // console.log($("#deck"));
      // $("#deck").modal("hide");
      // console.log("Mmmmm");
      // return false;
    }
  });

// document
//   .getElementById("contactForm")
//   .addEventListener("submit", async function (e) {
//     e.preventDefault();

//     const button = document.getElementById("continuecal");
//     const loader = document.getElementById("btn-loader");
//     button.disabled = true;
//     loader.classList.remove("d-none");

//     let name = document.getElementById("contactName").value;
//     let phone = document.getElementById("contactPhone").value;
//     let email = document.getElementById("email").value;

//     const data = {
//       emails: ["matinshaikh79070@gmail.com"],
//       subject: "New Pricing Submission",
//       message: `<strong>Name</strong> : ${name}<br/> <strong>Phone</strong> : ${phone}<br/> <strong>email</strong> : ${email}<br/>`,
//     };

//     try {
//       const response = await fetch("https://mailer-5x4h33dpla-uc.a.run.app/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });

//       const resultText = await response.text();
//       console.log(resultText);

//       if (response.ok) {
//         alert("Success: Your enquiry has been submitted!");
//         document.getElementById("contactForm").reset();
//         window.open("pdf.html", "_blank");
//         setTimeout(() => {
//           closeForm();
//         }, 1000);
//       } else {
//         alert(`Error: ${resultText}`);
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       alert("An error occurred. Please try again later.");
//     } finally {
//       button.disabled = false;
//       loader.classList.add("d-none");
//     }

//     function closeForm() {
//       window.location.href = document.URL;
//     }
//   });

// Global generic form submit handler for all inquiry forms
// Usage in HTML: onsubmit="return window.submit_form_inquiry(event,this)"
window.submit_form_inquiry = async function (e, formEl) {
  try {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    // Handle loader/button UI if present
    const button =
      (formEl &&
        (formEl.querySelector("#continuecal") ||
          formEl.querySelector(
            'button[type="submit"], input[type="submit"]'
          ))) ||
      document.getElementById("continuecal");
    const scopedLoader =
      (button &&
        (button.querySelector("#btn-loader, .btn-loader") ||
          button.querySelector(".cleenhearts-btn__loader"))) ||
      (formEl &&
        formEl.querySelector(
          "#btn-loader, .btn-loader, .cleenhearts-btn__loader"
        ));
    const loader = scopedLoader || document.getElementById("btn-loader");
    if (button) {
      try {
        const iconBox = button.querySelector(".cleenhearts-btn__icon-box");
        const textBox = button.querySelector(".cleenhearts-btn__text");
        if (iconBox) iconBox.classList.add("d-none");
        // Keep the text visible; show loader to the right of it
        if (loader) {
          loader.classList.remove("d-none");
          if (textBox && typeof textBox.after === "function") {
            textBox.after(loader);
          } else {
            button.appendChild(loader);
          }
          loader.style.display = loader.style.display || "inline-block";
          if (!loader.style.marginLeft) loader.style.marginLeft = "8px";
          // Reset absolute positioning if set previously
          if (loader.style.position === "absolute") loader.style.position = "";
          loader.style.right = "";
          loader.style.top = "";
          loader.style.transform = "";
          loader.style.zIndex = "";
        }
        button.disabled = true;
      } catch (_) {}
    }

    // Try to extract common fields by id or name
    const getVal = (selectors) => {
      for (const sel of selectors) {
        const byId = formEl ? formEl.querySelector(`#${sel}`) : null;
        if (byId && byId.value) return byId.value.trim();
        const byName = formEl ? formEl.querySelector(`[name="${sel}"]`) : null;
        if (byName && byName.value) return byName.value.trim();
      }
      return "";
    };

    const name = getVal([
      "contactName",
      "name",
      "full_name",
      "fullname",
      "your-name",
    ]);
    let phone = getVal([
      "contactPhone",
      "phone",
      "mobile",
      "tel",
      "your-phone",
    ]);
    // Fallbacks for phone
    if (!phone && formEl) {
      const telInput = formEl.querySelector('input[type="tel"]');
      if (telInput && telInput.value) phone = telInput.value.trim();
    }
    if (!phone && formEl) {
      const nameLikePhone = formEl.querySelector(
        'input[name*="phone" i], input[name*="mobile" i], input[name*="contact" i]'
      );
      if (nameLikePhone && nameLikePhone.value)
        phone = nameLikePhone.value.trim();
    }
    const email = getVal(["email", "your-email"]);
    // Capture additional need/details textarea ("Tell us more about your need")
    let need = getVal([
      "need",
      "message",
      "details",
      "requirement",
      "requirements",
      "your-message",
      "comment",
      "comments",
      "note",
      "notes",
    ]);
    if (!need && formEl) {
      const textareas = formEl.querySelectorAll("textarea");
      for (const ta of textareas) {
        if (ta && ta.value && ta.value.trim().length > 0) {
          need = ta.value.trim();
          break;
        }
      }
    }

    const pageSource = `${window.location.pathname}${
      window.location.search || ""
    }`;

    // Subject customization based on page
    const pathLower = window.location.pathname.toLowerCase();
    let subject = "New Pricing Submission";
    if (pathLower.includes("dysphagia")) {
      subject = "Dysphagia Inquiry source:-dysphagia";
    }

    const data = {
      emails: ["info@kadji.co.in"],
      subject: subject,
      message: `<strong>Name</strong> : ${name}<br/> <strong>Phone</strong> : ${phone}<br/> <strong>email</strong> : ${email}<br/>${
        need ? ` <strong>Need</strong> : ${need}<br/>` : ""
      } <strong>source</strong> : ${pageSource}<br/>`,
    };

    const response = await fetch("https://mailer-5x4h33dpla-uc.a.run.app/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const resultText = await response.text();
    console.log(resultText);
    if (response.ok) {
      if (formEl && typeof formEl.reset === "function") formEl.reset();
      window.location.href = "thankyou.html";
    } else {
      alert(`Error: ${resultText}`);
    }
  } catch (error) {
    console.error("Form submit error:", error);
  } finally {
    // Restore loader/button UI
    const button =
      (formEl &&
        (formEl.querySelector("#continuecal") ||
          formEl.querySelector(
            'button[type="submit"], input[type="submit"]'
          ))) ||
      document.getElementById("continuecal");
    const scopedLoader =
      (button &&
        (button.querySelector("#btn-loader, .btn-loader") ||
          button.querySelector(".cleenhearts-btn__loader"))) ||
      (formEl &&
        formEl.querySelector(
          "#btn-loader, .btn-loader, .cleenhearts-btn__loader"
        ));
    const loader = scopedLoader || document.getElementById("btn-loader");
    if (button) {
      try {
        const iconBox = button.querySelector(".cleenhearts-btn__icon-box");
        const textBox = button.querySelector(".cleenhearts-btn__text");
        if (iconBox) iconBox.classList.remove("d-none");
        if (textBox) textBox.classList.remove("d-none");
        if (loader) {
          loader.classList.add("d-none");
          // Cleanup inline styles we may have applied
          loader.style.position = "";
          loader.style.right = "";
          loader.style.top = "";
          loader.style.transform = "";
          loader.style.zIndex = "";
        }
        button.disabled = false;
      } catch (_) {}
    }
  }
  return false;
};
