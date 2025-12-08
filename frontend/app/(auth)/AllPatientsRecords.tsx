import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // <-- Changed from useNavigation to useRouter

// --- PLACEHOLDER API SERVICE ---
// NOTE: In a real app, define this external file: '../services/userService.ts'
interface Patient {
  _id: string;
  name: string;
  email: string;
  dob?: string;
  role: "patient";
}

const fetchPatientsApi = async (): Promise<Patient[]> => {
  // Mock API Call: Simulate fetching a list of patients
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      _id: "p001",
      name: "Alia Bhatt",
      email: "alia@example.com",
      dob: "1993-03-15T00:00:00.000Z",
      role: "patient",
    },
    {
      _id: "p002",
      name: "Ranbir Kapoor",
      email: "ranbir@example.com",
      dob: "1982-09-28T00:00:00.000Z",
      role: "patient",
    },
    {
      _id: "p003",
      name: "Deepika Padukone",
      email: "deepika@example.com",
      dob: "1986-01-05T00:00:00.000Z",
      role: "patient",
    },
    {
      _id: "p004",
      name: "Shah Rukh Khan",
      email: "srk@example.com",
      dob: "1965-11-02T00:00:00.000Z",
      role: "patient",
    },
  ];
};
// --- END PLACEHOLDER API SERVICE ---

const AllPatientRecords: React.FC = () => {
  const router = useRouter(); // <-- Used useRouter instead of useNavigation
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Replace with actual API integration later
      const apiPatients = await fetchPatientsApi();
      setPatients(apiPatients);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      Alert.alert("Error", "Failed to fetch patient records");
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    // Remove the timezone/time component for cleaner date parsing
    const date = new Date(dateString.split("T")[0]);
    if (isNaN(date.getTime())) return "N/A"; // Check for valid date

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return 0;
    const today = new Date();
    // Ensure we parse only the date part to avoid timezone issues
    const birthDate = new Date(dob.split("T")[0]);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const handlePatientPress = (patient: Patient) => {
    // FIX: Using the exact string literal expected by TypeScript (usually the file name without extension)
    // If the file is app/ImagingScreen.tsx, the path is '/ImagingScreen'.
    router.push({
      pathname: "./(auth)/ImagingScreen", // <-- Added leading slash to denote root path
      params: { patientId: patient._id, patientName: patient.name },
    });
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handlePatientPress(item)}
    >
      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientAge}>{calculateAge(item.dob)} years</Text>
        </View>

        <View style={styles.patientDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>DOB: {formatDate(item.dob)}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // --- Render Logic ---

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading patient records...</Text>
        </View>
      );
    }

    if (patients.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Ionicons
            name="people-outline"
            size={50}
            color="#ccc"
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.loadingText}>
            No active patient records found.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total Patients: {patients.length}
          </Text>
        </View>

        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Patient Records</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    // Removed unnecessary paddingVertical: 35 as SafeAreaView handles top/bottom
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  statsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20, // Reduced vertical padding slightly
    gap: 12, // Use gap for better spacing than margins on FlatList
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientInfo: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333", // Darker text color
    flex: 1,
    marginRight: 10,
  },
  patientAge: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  patientDetails: {
    gap: 6, // Increased gap for better readability
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default AllPatientRecords;
