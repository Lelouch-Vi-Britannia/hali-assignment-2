import numpy as np
from PIL import Image as im
import matplotlib

matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import sklearn.datasets as datasets


class KMeans:

    def __init__(self, data, k):
        self.centers = None
        self.data = data
        self.k = k
        self.assignment = [-1 for _ in range(len(data))]
        self.snaps = []

    def snap(self, centers):
        TEMPFILE = "temp.png"

        # Create a square plot to match the canvas size
        fig, ax = plt.subplots(figsize=(5, 5))

        # Set fixed axis limits to align with the canvas coordinate range
        ax.set_xlim(-5, 5)
        ax.set_ylim(-5, 5)

        # Plot data points and centroids
        ax.scatter(self.data[:, 0], self.data[:, 1], c=self.assignment, cmap='viridis')
        ax.scatter(centers[:, 0], centers[:, 1], c='r', marker='o', s=100)

        # Remove any extra elements such as legends or titles to maximize the plot area
        ax.axis('off')  # Turn off axes to use the entire frame

        fig.tight_layout(pad=0)  # Remove padding around the plot
        fig.savefig(TEMPFILE, bbox_inches='tight', pad_inches=0)
        plt.close()

        # Append the snapshot to the list of images
        self.snaps.append(im.fromarray(np.asarray(im.open(TEMPFILE))))


    def isunassigned(self, i):
        return self.assignment[i] == -1

    def initialize(self, method='random'):
        if method == 'random':
            # Correctly select k unique points
            indices = np.random.choice(len(self.data), size=self.k, replace=False)
            centers = self.data[indices]
        elif method == 'farthest_first':
            centers = self.farthest_first_initialize()
        elif method == 'kmeans++':
            centers = self.kmeans_plus_plus_initialize()
        else:
            raise ValueError(f"Unknown initialization method: {method}")

        if centers is None or len(centers) != self.k:
            raise ValueError(
                f"Initialization failed: Expected {self.k} centers but got {len(centers) if centers is not None else 0}.")

        self.snap(centers)

        '''
        TEMPFILE = f"initial_centers_{method}.png"
        fig, ax = plt.subplots()
        ax.scatter(self.data[:, 0], self.data[:, 1], c='b', marker='o')
        ax.scatter(centers[:, 0], centers[:, 1], c='r', marker='x')
        ax.set_title(f"Initialization Method: {method}")
        fig.savefig(TEMPFILE)
        plt.close()
        '''

        return centers

    def farthest_first_initialize(self):
        centers = [self.data[np.random.randint(len(self.data))]]
        while len(centers) < self.k:
            distances = np.array([min([self.dist(p, c) for c in centers]) for p in self.data])
            new_center = self.data[np.argmax(distances)]
            centers.append(new_center)
        return np.array(centers)

    def kmeans_plus_plus_initialize(self):
        centers = [self.data[np.random.randint(len(self.data))]]
        for _ in range(1, self.k):
            distances = np.array([min([self.dist(p, c) ** 2 for c in centers]) for p in self.data])
            probabilities = distances / distances.sum()
            cumulative_probabilities = np.cumsum(probabilities)
            r = np.random.rand()
            new_center = self.data[np.searchsorted(cumulative_probabilities, r)]
            centers.append(new_center)
        return np.array(centers)

    def make_clusters(self, centers):
        for i in range(len(self.assignment)):
            dist = float('inf')
            for j in range(self.k):
                if self.isunassigned(i):
                    self.assignment[i] = j
                    dist = self.dist(centers[j], self.data[i])
                else:
                    new_dist = self.dist(centers[j], self.data[i])
                    if new_dist < dist:
                        self.assignment[i] = j
                        dist = new_dist

    def compute_centers(self):
        centers = []
        for i in range(self.k):
            cluster = [self.data[j] for j in range(len(self.assignment)) if self.assignment[j] == i]
            if len(cluster) > 0:
                centers.append(np.mean(np.array(cluster), axis=0))
            else:
                # If a cluster is empty, reinitialize its center randomly
                centers.append(self.data[np.random.choice(len(self.data))])

        return np.array(centers)


    def unassign(self):
        self.assignment = [-1 for _ in range(len(self.data))]

    def are_diff(self, centers, new_centers):
        for i in range(self.k):
            if self.dist(centers[i], new_centers[i]) != 0:
                return True
        return False

    def dist(self, x, y):
        # Euclidean distance
        return sum((x - y) ** 2) ** (1 / 2)

    def lloyds(self):
        # Use existing centers if defined, otherwise initialize them
        if not hasattr(self, 'centers') or self.centers is None:
            self.centers = self.initialize()

        self.make_clusters(self.centers)
        new_centers = self.compute_centers()
        self.snap(new_centers)
        while self.are_diff(self.centers, new_centers):
            self.unassign()
            self.centers = new_centers
            self.make_clusters(self.centers)
            new_centers = self.compute_centers()
            self.snap(new_centers)


    def lloyds_step(self):
        if not hasattr(self, 'centers'):
            self.centers = self.initialize()

        # Save the old centers for comparison
        old_centers = self.centers.copy()

        self.unassign()
        self.make_clusters(self.centers)
        self.centers = self.compute_centers()
        self.snap(self.centers)

        # Check if the algorithm has converged
        if not self.are_diff(old_centers, self.centers):
            print("Converged")
            return False  # Return False if converged
        else:
            return True  # Return True if not yet converged


'''
centers = [[0, 0], [2, 2], [-3, 2], [2, -4]]
X, _ = datasets.make_blobs(n_samples=300, centers=centers, cluster_std=1, random_state=0)
kmeans = KMeans(X, 4)
kmeans.lloyds()
kstep = KMeans(X, 4)
kstep.centers = kstep.initialize('farthest')
kstep.lloyds_step()
count = 0
while kstep.lloyds_step():
    count += 1
    print(count)



images = kstep.snaps

images[0].save(
    'kmeans.gif',
    optimize=False,
    save_all=True,
    append_images=images[1:],
    loop=0,

    duration=500
)
'''