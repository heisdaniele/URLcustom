// custom.js

// Function to update the live preview as the user types the custom alias
function updateLivePreview() {
    const aliasInput = document.getElementById('custom-alias-input').value.trim();
    // Replace spaces with hyphens and convert to lower case
    const sanitizedAlias = aliasInput.replace(/\s+/g, "-").toLowerCase();
    const livePreviewContainer = document.getElementById('live-preview-container');
    const livePreviewText = document.getElementById('live-preview-text');
  
    if (sanitizedAlias) {
      livePreviewText.textContent = window.location.origin + "/" + sanitizedAlias;
      livePreviewContainer.classList.remove('hidden');
    } else {
      livePreviewContainer.classList.add('hidden');
      livePreviewText.textContent = "";
    }
  }
  
  // Function to create the custom URL by calling the POST endpoint
  async function generateCustomUrl() {
    const originalUrlInput = document.getElementById('default-url-input').value.trim();
    let aliasInput = document.getElementById('custom-alias-input').value.trim();
    const defaultUrlError = document.getElementById('default-url-error');
    const customErrorMessage = document.getElementById('custom-error-message');
    const resultContainer = document.getElementById('custom-result-container');
    const shortUrlInput = document.getElementById('custom-short-url');
  
    // Validate original URL
    if (!originalUrlInput) {
      defaultUrlError.textContent = "Please paste your original URL.";
      defaultUrlError.classList.remove('hidden');
      resultContainer.classList.add('hidden');
      return;
    } else {
      defaultUrlError.classList.add('hidden');
    }
  
    // Validate and sanitize custom alias
    if (!aliasInput) {
      customErrorMessage.textContent = "Please enter a custom alias.";
      customErrorMessage.classList.remove('hidden');
      resultContainer.classList.add('hidden');
      return;
    } else {
      aliasInput = aliasInput.replace(/\s+/g, "-").toLowerCase();
      customErrorMessage.classList.add('hidden');
    }
  
    try {
      // Call the API endpoint to create the custom URL record
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: originalUrlInput,
          custom_alias: aliasInput
        })
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "An error occurred while creating your URL.");
        return;
      }
  
      // The URL has been created in the database.
      // Display the generated URL using the current window location as the base.
      const finalUrl = window.location.origin + "/" + aliasInput;
      shortUrlInput.value = finalUrl;
      resultContainer.classList.remove('hidden');
    } catch (error) {
      console.error("Error creating custom URL:", error);
      alert("An error occurred while creating your URL.");
    }
  }
  
  // Function to copy the custom URL to clipboard
  async function copyCustomUrl() {
    try {
      const urlToCopy = document.getElementById('custom-short-url').value;
      await navigator.clipboard.writeText(urlToCopy);
      const customSuccessElement = document.getElementById('custom-copy-success');
      customSuccessElement.style.opacity = '1';
      setTimeout(() => {
        customSuccessElement.style.opacity = '0';
      }, 2000);
    } catch (err) {
      alert('Failed to copy URL. Please copy manually.');
    }
  }
  
  // Function to handle contact form submission (optional)
  function handleCustomContactSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;
    submitButton.disabled = true;
  
    setTimeout(() => {
      submitButton.innerHTML = `<i class="fas fa-paper-plane"></i> Send Message`;
      submitButton.disabled = false;
      form.reset();
      alert('Thank you for reaching out! We will get back to you soon.');
    }, 1500);
  
    return false;
  }
  