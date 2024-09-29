// Initial button setup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('initializeKMeans').disabled = true;
    document.getElementById('stepKMeans').disabled = true;
    document.getElementById('convergeKMeans').disabled = true;
    document.getElementById('resetKMeans').disabled = true;
});

let manualCentroids = [];  // Array to hold manually selected centroids

// Function to get the selected initialization method
function getInitializationMethod() {
    return document.getElementById('initMethod').value;
}

// Function to handle canvas click for manual centroid selection
function handleCanvasClick(event) {
    if (getInitializationMethod() === 'manual' && manualCentroids.length < parseInt(document.getElementById('numClusters').value)) {
        const canvas = document.getElementById('kmeansCanvas');
        const rect = canvas.getBoundingClientRect();

        // Get mouse click coordinates relative to the canvas
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert canvas coordinates to data coordinates (assuming range is -5 to 5)
        const canvasWidth = 500;
        const canvasHeight = 500;
        const dataX = (x / canvasWidth) * 10 - 5;  // Convert x coordinate to range -5 to 5
        const dataY = 5 - (y / canvasHeight) * 10; // Convert y coordinate to range -5 to 5 (inverted y-axis)

        manualCentroids.push([dataX, dataY]);

        // Draw the point to visualize selection
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // If enough centroids are selected, enable stepKMeans and convergeKMeans buttons
        const k = document.getElementById('numClusters').value;
        if (manualCentroids.length === parseInt(k)) {
            initializeManualCentroids(manualCentroids);
            manualCentroids = [];  // Clear the array for future use

            // Enable step and convergence buttons
            document.getElementById('stepKMeans').disabled = false;
            document.getElementById('convergeKMeans').disabled = false;

            // Disable canvas click listener to stop further input
            canvas.removeEventListener('click', handleCanvasClick);
        }
    }
}

// Add event listener for canvas clicks for manual centroid selection
document.getElementById('kmeansCanvas').addEventListener('click', handleCanvasClick);

// Event listener for initialization method change
document.getElementById('initMethod').addEventListener('change', () => {
    const initMethod = getInitializationMethod();
    if (initMethod === 'manual') {
        document.getElementById('initializeKMeans').disabled = true;
        showNotification("Manual mode selected. Click on the canvas to select centroids.");
    } else {
        document.getElementById('initializeKMeans').disabled = false;
        showNotification("");
    }
});

// Function to send manual centroids to the backend
async function initializeManualCentroids(centroids) {
    await fetch('/initialize_manual_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centroids })
    });

    // Display the initial state of KMeans after manual initialization
    await displayImage('/get_dataset');
}

// Function to display dataset or clustering result on canvas
async function displayImage(url) {
    const response = await fetch(url);
    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    const canvas = document.getElementById('kmeansCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
        // Set canvas size to 500x500
        canvas.width = 500;
        canvas.height = 500;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
}

// Function to display a notification
function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    notificationElement.textContent = message;
}

// Generate a new dataset
document.getElementById('generateDataset').addEventListener('click', async () => {
    await fetch('/reset_kmeans', { method: 'POST' });

    await fetch('/generate_dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    await displayImage('/get_dataset');

    document.getElementById('initializeKMeans').disabled = false;
    document.getElementById('resetKMeans').disabled = false;
    document.getElementById('stepKMeans').disabled = true;
    document.getElementById('convergeKMeans').disabled = true;

    // Handle initialization method status
    const initMethod = getInitializationMethod();
    if (initMethod === 'manual') {
        document.getElementById('initializeKMeans').disabled = true;
    }
});

// Handle initialization of KMeans
document.getElementById('initializeKMeans').addEventListener('click', async () => {
    const k = document.getElementById('numClusters').value;
    const initMethod = getInitializationMethod();

    await fetch('/initialize_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k, initMethod })
    });

    await displayImage('/get_dataset');

    document.getElementById('stepKMeans').disabled = false;
    document.getElementById('convergeKMeans').disabled = false;
    document.getElementById('initializeKMeans').disabled = true;
});

// Step through the KMeans process
document.getElementById('stepKMeans').addEventListener('click', async () => {
    const k = document.getElementById('numClusters').value;

    const response = await fetch('/step_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k })
    });

    if (response.status === 200) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            if (responseData.message === "Converged") {
                showNotification("The KMeans algorithm has converged.");
                document.getElementById('stepKMeans').disabled = true;
                document.getElementById('convergeKMeans').disabled = true;
            }
        } else {
            await displayImage(URL.createObjectURL(await response.blob()));
        }
    } else {
        console.error("Failed to step KMeans");
    }
});

// Run KMeans to convergence
document.getElementById('convergeKMeans').addEventListener('click', async () => {
    const k = document.getElementById('numClusters').value;

    const response = await fetch('/converge_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k })
    });

    if (response.status === 200) {
        await displayImage(URL.createObjectURL(await response.blob()));
        showNotification("The KMeans algorithm has converged.");
        document.getElementById('stepKMeans').disabled = true;
        document.getElementById('convergeKMeans').disabled = true;
    } else {
        console.error("Failed to converge KMeans");
    }
});

// Reset the algorithm
document.getElementById('resetKMeans').addEventListener('click', async () => {
    await fetch('/reset_kmeans', { method: 'POST' });
    await displayImage('/get_dataset');

    document.getElementById('initializeKMeans').disabled = false;
    document.getElementById('stepKMeans').disabled = true;
    document.getElementById('convergeKMeans').disabled = true;

    document.getElementById('kmeansCanvas').addEventListener('click', handleCanvasClick);

    showNotification("");

    // Handle initialization method status
    const initMethod = getInitializationMethod();
    if (initMethod === 'manual') {
        document.getElementById('initializeKMeans').disabled = true;
    }
});
