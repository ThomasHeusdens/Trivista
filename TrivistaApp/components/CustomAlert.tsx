/**
 * Displays a general-purpose alert modal used across multiple pages.
 * Provides title, message, and an "OK" button to dismiss the alert.
 * @module
 */
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

/**
 * CustomAlert component
 *
 * A reusable alert modal that can be shown anywhere in the app.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {string} props.title - Alert title text
 * @param {string} props.message - Alert message text
 * @param {() => void} props.onClose - Callback triggered when the modal is dismissed
 * @returns {React.JSX.Element} Rendered alert modal
 */
const CustomAlert = ({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void; }): React.JSX.Element => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

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
