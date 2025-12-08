import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal, // Added Modal for better image viewing experience
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // <-- Added Expo Router Import
import { Card, Button as PaperButton } from "react-native-paper"; // Renamed Button to PaperButton

interface ImageData {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  radiologist: string;
  description?: string;
}

// Replaced Interface with React.FC<{}> and removed navigation/route props
const ImagingScreen: React.FC<{}> = () => {
  const router = useRouter(); // <-- Initializing router hook

  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setImages([
        {
          id: "1",
          name: "CT Scan - Brain",
          url: "https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=CT+Scan",
          uploadedAt: "2024-01-15 14:30",
          radiologist: "Dr. Smith",
          description: "Axial CT scan showing normal brain anatomy",
        },
        {
          id: "2",
          name: "MRI - Brain",
          url: "https://via.placeholder.com/400x300/7ED321/FFFFFF?text=MRI+Scan",
          uploadedAt: "2024-01-15 15:45",
          radiologist: "Dr. Johnson",
          description: "T2-weighted MRI showing detailed brain structures",
        },
        {
          id: "3",
          name: "X-Ray - Chest",
          url: "https://via.placeholder.com/400x300/BD10E0/FFFFFF?text=X-Ray",
          uploadedAt: "2024-01-15 16:20",
          radiologist: "Dr. Williams",
          description: "Chest X-ray showing clear lung fields",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleImagePress = (image: ImageData) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownload = (image: ImageData) => {
    Alert.alert("Download Image", `Download ${image.name}?`, [
      { text: "Cancel", style: "cancel" },
      // NOTE: In a real app, use expo-file-system or similar for actual download
      {
        text: "Download",
        onPress: () =>
          console.log("Downloading:", image.name, "from URL:", image.url),
      },
    ]);
  };

  const ImageCard = ({ image }: { image: ImageData }) => (
    <TouchableOpacity
      style={styles.imageCard}
      onPress={() => handleImagePress(image)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: image.url }}
        style={styles.thumbnail}
        // Fallback for image loading errors
        onError={() => console.log("Error loading thumbnail for:", image.name)}
      />
      <View style={styles.imageInfo}>
        <Text style={styles.imageName}>{image.name}</Text>
        <Text style={styles.radiologist}>By: {image.radiologist}</Text>
        <Text style={styles.uploadTime}>{image.uploadedAt}</Text>
        {image.description && (
          <Text style={styles.description}>{image.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()} // <-- Uses router.back()
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Images</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Images List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imagesContainer}>
          {images.length > 0 ? (
            images.map((image) => <ImageCard key={image.id} image={image} />)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No images available</Text>
              <Text style={styles.emptySubtext}>
                Images will appear here once uploaded by radiologists
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Modal (Using standard Modal component now) */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedImage?.name}</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalImageScroll}>
              <Image
                source={{ uri: selectedImage?.url }}
                style={styles.fullImage}
                resizeMode="contain"
                // Fallback for image loading errors on full view
                onError={() =>
                  Alert.alert("Error", "Could not load full image.")
                }
              />
            </ScrollView>

            <View style={styles.modalInfo}>
              <Text style={styles.modalRadiologist}>
                Radiologist: {selectedImage?.radiologist}
              </Text>
              <Text style={styles.modalUploadTime}>
                Uploaded: {selectedImage?.uploadedAt}
              </Text>
              {selectedImage?.description && (
                <Text style={styles.modalDescription}>
                  {selectedImage.description}
                </Text>
              )}
            </View>

            <PaperButton
              mode="contained"
              style={styles.downloadButton}
              onPress={() => selectedImage && handleDownload(selectedImage)}
            >
              Download Image
            </PaperButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20, // Increased size slightly
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  imagesContainer: {
    padding: 15,
  },
  imageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 4, // Increased elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageInfo: {
    padding: 15,
  },
  imageName: {
    fontSize: 18, // Increased size
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  radiologist: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  uploadTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 22,
    color: "#666",
  },
  modalImageScroll: {
    maxHeight: 500, // Allows large images to scroll
  },
  fullImage: {
    width: "100%",
    height: 350, // Increased size
    resizeMode: "contain", // Ensure the whole image is visible
  },
  modalInfo: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalRadiologist: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  modalUploadTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  downloadButton: {
    backgroundColor: "#4A90E2",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
});

export default ImagingScreen;
