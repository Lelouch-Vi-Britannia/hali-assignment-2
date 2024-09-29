from flask import Flask, render_template, request, jsonify, send_file
from io import BytesIO
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
from sklearn import datasets
from k_means_impl import KMeans

app = Flask(__name__)

# Global variables to store the current KMeans object and dataset
kmeans = None
data = None

# Function to generate initial dataset
def generate_initial_dataset():
    global data
    # Create a new dataset with random centers
    num_centers = np.random.randint(2, 11)
    centers = np.random.uniform(low=-2.5, high=2.5, size=(num_centers, 2))
    data, _ = datasets.make_blobs(n_samples=300, centers=centers, cluster_std=1)

# Function to create dataset visualization
def create_dataset_visualization():
    TEMPFILE = "generated_dataset.png"
    fig, ax = plt.subplots(figsize=(5, 5))  # Make the plot more square to match the canvas
    ax.scatter(data[:, 0], data[:, 1], c='b', marker='o')
    if kmeans and kmeans.centers is not None:
        ax.scatter(kmeans.centers[:, 0], kmeans.centers[:, 1], c='r', marker='o')

    # Set fixed axis limits to match the canvas size
    ax.set_xlim(-5, 5)
    ax.set_ylim(-5, 5)

    ax.axis('off')  # Turn off axes to use the entire frame

    fig.tight_layout(pad=0)  # Remove padding around the plot
    fig.savefig(TEMPFILE, bbox_inches='tight', pad_inches=0)
    plt.close()

    return TEMPFILE

@app.route('/')
def index():
    # Render the main page
    return render_template('index.html')

@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    # Generate initial dataset without initializing KMeans
    generate_initial_dataset()
    return jsonify({"message": "Dataset generated successfully"})

@app.route('/get_dataset', methods=['GET'])
def get_dataset():
    # Generate and send the dataset visualization
    image_file = create_dataset_visualization()
    return send_file(image_file, mimetype='image/png')

@app.route('/initialize_kmeans', methods=['POST'])
def initialize_kmeans():
    global kmeans
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    # Extract initialization parameters from request
    request_data = request.get_json()
    k = int(request_data['k'])
    init_method = request_data['initMethod']

    # Initialize KMeans with the current dataset
    kmeans = KMeans(data, k)
    kmeans.centers = kmeans.initialize(method=init_method)

    return jsonify({"message": "KMeans initialized successfully"})

@app.route('/initialize_manual_kmeans', methods=['POST'])
def initialize_manual_kmeans():
    global kmeans
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    # Extract manually selected centroids from request
    request_data = request.get_json()
    centroids = np.array(request_data['centroids'])

    # Initialize KMeans with manual centroids
    kmeans = KMeans(data, len(centroids))
    kmeans.centers = centroids

    return jsonify({"message": "KMeans manually initialized successfully"})

@app.route('/step_kmeans', methods=['POST'])
def step_kmeans():
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    if kmeans is None:
        return jsonify({"message": "Algorithm has not initialized"}), 400

    if kmeans.lloyds_step():
        return send_image(kmeans.snaps[-1])
    else:
        return jsonify({"message": "Converged"}), 200

@app.route('/converge_kmeans', methods=['POST'])
def converge_kmeans():
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    kmeans.lloyds()  # Run KMeans until convergence
    return send_image(kmeans.snaps[-1])

@app.route('/reset_kmeans', methods=['POST'])
def reset_kmeans():
    global kmeans
    kmeans = None  # Reset KMeans clustering while keeping dataset intact
    return jsonify({"message": "KMeans reset successfully"})

# Utility function to send an image
def send_image(image):
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(port=3000, debug=True)
