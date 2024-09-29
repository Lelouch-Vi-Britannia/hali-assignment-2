let manualCentroids = [];  // Array to hold manually selected centroids

// Function to display a notification
function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    notificationElement.textContent = message;
}

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

        // If enough centroids are selected, send to backend
        const k = document.getElementById('numClusters').value;
        if (manualCentroids.length === parseInt(k)) {
            initializeManualCentroids(manualCentroids);
            manualCentroids = [];  // Clear the array for future use

            // Remove event listener to stop taking further input
            canvas.removeEventListener('click', handleCanvasClick);
        }
    }
}

// Add event listener for canvas clicks for manual centroid selection
document.getElementById('kmeansCanvas').addEventListener('click', handleCanvasClick);

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

// Generate a new dataset
document.getElementById('generateDataset').addEventListener('click', async () => {
    // Reset the KMeans algorithm to prevent issues with previous state
    await fetch('/reset_kmeans', { method: 'POST' });

    // Generate the new dataset
    await fetch('/generate_dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    // Display the new dataset
    await displayImage('/get_dataset');
});

// Handle initialization of KMeans
document.getElementById('initializeKMeans').addEventListener('click', async () => {
    const k = document.getElementById('numClusters').value;
    const initMethod = getInitializationMethod();

    // Initialize KMeans with the selected k and method
    await fetch('/initialize_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k, initMethod })
    });

    // Display the initial state of KMeans after initialization
    await displayImage('/get_dataset');
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

    await displayImage(URL.createObjectURL(await response.blob()));
    if (response.status === 200) {
        showNotification("The KMeans algorithm has converged.");
    }
});

// Reset the algorithm
document.getElementById('resetKMeans').addEventListener('click', async () => {
    await fetch('/reset_kmeans', { method: 'POST' });
    await displayImage('/get_dataset'); // Re-display the dataset after resetting

    // Re-enable canvas click listener for manual centroid selection
    document.getElementById('kmeansCanvas').addEventListener('click', handleCanvasClick);

    // Clear the notification area
    showNotification("");
});