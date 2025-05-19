import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";

const CustomTrainAlert = ({ visible, title, message, onClose }) => {
  const router = useRouter();

  const handleTrainNow = () => {
    onClose();
    router.push("/maps/map");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Close button top right */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="white" size={28} />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity onPress={handleTrainNow} style={styles.button}>
            <Text style={styles.buttonText}>TRAIN NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomTrainAlert;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    backgroundColor: "#1E1E1E",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FACC15",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
  title: {
    fontSize: 18,
    color: "#FACC15",
    fontFamily: "InterBold",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: "InterRegular",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#FACC15",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#1E1E1E",
    fontSize: 20,
    fontFamily: "Bison",
    letterSpacing: 1.5,
  },
});
