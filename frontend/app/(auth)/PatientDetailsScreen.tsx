import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // <-- Expo Router Imports
import { Ionicons } from "@expo/vector-icons"; // Added Ionicons for back button

interface PatientData {
  name: string;
  age: number;
  sex: string;
  pulse: number;
  bp: string;
}

// Converted to Expo Router component structure
const PatientDetails: React.FC<{}> = () => {
  const router = useRouter();
  // Using local search params to pass patient ID/data, though using mock data for now
  const params = useLocalSearchParams();

  const [currentTime, setCurrentTime] = useState<string>("");

  // Mock patient data (can be replaced by fetching data using params.patientId)
  const [patientData] = useState<PatientData>({
    name: (params.patientName as string) || "John Doe",
    age: parseInt(params.patientAge as string) || 65,
    sex: "Male",
    pulse: 85,
    bp: "140/90",
  });

  useEffect(() => {
    // Logic to set current time for display
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedTime = `${hours % 12 || 12}:${minutes
      .toString()
      .padStart(2, "0")} ${hours >= 12 ? "pm" : "am"}`;
    setCurrentTime(formattedTime);
  }, []);

  const handleAlert = () => {
    Alert.alert(
      "Emergency Alert",
      "Patient requires immediate medical attention!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Alert",
          style: "destructive",
          onPress: () => console.log("Alert Sent for:", patientData.name),
        },
      ]
    );
  };

  const handleExaminations = () => {
    // Navigate to Examinations screen, passing patient ID if necessary
    // router.push("/Examinations");
  };

  const handleImaging = () => {
    // Navigate to Imaging screen, passing patient ID if necessary
    router.push("/ImagingScreen"); // Assuming the file is named ImagingScreen.tsx
  };

  const handleGoBack = () => {
    router.back();
  };

  const TableRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <View style={styles.tableRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header/Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        <View style={styles.detailsHeader}>
          <Text style={styles.mainTitle}>Patient Details</Text>
          <Text style={styles.headerText}>
            Record ID created at - {currentTime}
          </Text>
        </View>

        {/* Patient Table */}
        <View style={styles.tableContainer}>
          <TableRow label="Patient Name" value={patientData.name} />
          <TableRow label="Age" value={patientData.age} />
          <TableRow label="Sex" value={patientData.sex} />
          <TableRow label="Pulse" value={`${patientData.pulse} bpm`} />
          <TableRow label="BP" value={patientData.bp} />
        </View>

        {/* ALERT Button */}
        <TouchableOpacity style={styles.alertButton} onPress={handleAlert}>
          <Text style={styles.alertText}>ALERT</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleExaminations}
        >
          <Text style={styles.bottomButtonText}>EXAMINATIONS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomButton} onPress={handleImaging}>
          <Text style={styles.bottomButtonText}>IMAGING</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  topHeader: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backButton: {
    padding: 10,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  detailsHeader: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  headerText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  tableContainer: {
    width: "100%",
    maxWidth: 400,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  alertButton: {
    backgroundColor: "#FF3B30", // Red for emergency
    marginTop: 40,
    borderRadius: 12,
    paddingVertical: 25,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  alertText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
    marginTop: 20,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: "#007AFF", // Blue for actions
    paddingVertical: 18,
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default PatientDetails;
