// Generate new dataset
document.getElementById('generateDataset').addEventListener('click', async function() {
    console.log('Generating new dataset...');
    const response = await fetch('/generate_dataset', {
        method: 'POST',
    });
    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
});


// Step through KMeans
document.getElementById('stepKMeans').addEventListener('click', async function() {
    console.log('Stepping through KMeans...');
    const formData = new FormData();
    const numClusters = document.getElementById('numClusters').value;
    formData.append('k', numClusters);

    const response = await fetch('/step_kmeans', {
        method: 'POST',
        body: formData,
    });
    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
});

// Run KMeans to convergence
document.getElementById('convergeKMeans').addEventListener('click', async function() {
    console.log('Running KMeans to convergence...');
    const formData = new FormData();
    const numClusters = document.getElementById('numClusters').value;
    formData.append('k', numClusters);

    const response = await fetch('/converge_kmeans', {
        method: 'POST',
        body: formData,
    });
    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
});

// Function to clear the canvas
function clearCanvas() {
    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to display the dataset
async function displayDataset() {
    console.log('Displaying current dataset...');
    const response = await fetch('/get_dataset', { method: 'GET' });
    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
    };
}

// Handle reset algorithm
document.getElementById('resetKMeans').addEventListener('click', async function() {
    console.log('Resetting KMeans...');
    await fetch('/reset_kmeans', { method: 'POST' });

    // Clear the canvas and re-draw the dataset immediately
    clearCanvas();
    setTimeout(displayDataset, 100); // Use a short delay to ensure dataset re-draws correctly
});





