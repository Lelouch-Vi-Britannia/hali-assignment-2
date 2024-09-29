from flask import Flask, render_template, request, jsonify, send_file
from io import BytesIO
import os
import numpy as np
from PIL import Image
from sklearn import datasets
from k_means_impl import KMeans
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt

app = Flask(__name__)

# Global variables to store KMeans object
kmeans = None
data = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    global data
    num_centers = np.random.randint(2, 11)  # Random number of centers between 2 and 10
    centers = np.random.uniform(low=-5, high=5, size=(num_centers, 2))  # Random centers
    data, _ = datasets.make_blobs(n_samples=300, centers=centers, cluster_std=1)

    # Create a visualization of the generated dataset
    TEMPFILE = "generated_dataset.png"
    fig, ax = plt.subplots()
    ax.scatter(data[:, 0], data[:, 1], c='b', marker='o')
    fig.savefig(TEMPFILE)
    plt.close()

    return send_file(TEMPFILE, mimetype='image/png')

@app.route('/start_kmeans', methods=['POST'])
def start_kmeans():
    global kmeans
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    k = int(request.form['k'])
    init_method = request.form.get('init_method', 'random')
    kmeans = KMeans(data, k)
    kmeans.centers = kmeans.initialize(method=init_method)

    # Take an initial snapshot to visualize the starting centroids
    kmeans.snap(kmeans.centers)
    return send_image(kmeans.snaps[-1])  # Send the initial snapshot to the frontend

@app.route('/step_kmeans', methods=['POST'])
def step_kmeans():
    global kmeans
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    kmeans.lloyds_step()
    return send_image(kmeans.snaps[-1])

@app.route('/converge_kmeans', methods=['POST'])
def converge_kmeans():
    global kmeans
    if data is None:
        return jsonify({"error": "Dataset not initialized"}), 400

    kmeans.lloyds()
    return send_image(kmeans.snaps[-1])

@app.route('/reset_kmeans', methods=['POST'])
def reset_kmeans():
    global kmeans
    kmeans = None
    return jsonify({"message": "KMeans reset successfully"})

def send_image(image):
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(port=3000, debug=True)
