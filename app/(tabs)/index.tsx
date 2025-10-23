import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { type GranularPermission } from "expo-media-library";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { ImageSourcePropType, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { captureRef } from "react-native-view-shot";

import Button from "@/components/Button";
import CircleButton from "@/components/CircleButton";
import EmojiList from "@/components/EmojiList";
import EmojiPicker from "@/components/EmojiPicker";
import IconButton from "@/components/IconButton";
import ImageViewer from "@/components/ImageViewer";

import EmojiSticker from "@/components/EmojiSticker";

const PlaceholderImage = require("@/assets/images/background-image.png");
const MEDIA_LIBRARY_GRANULAR_PERMISSIONS: GranularPermission[] = ["photo"];

export default function Index() {
  const isAndroidExpoGo =
    Platform.OS === "android" && Constants.appOwnership === "expo";
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined
  );
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [pickedEmoji, setPickedEmoji] = useState<
    ImageSourcePropType | undefined
  >(undefined);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: MEDIA_LIBRARY_GRANULAR_PERMISSIONS,
    get: !isAndroidExpoGo,
  });
  const imageRef = useRef<View>(null);

  useEffect(() => {
    if (isAndroidExpoGo || !permissionResponse) {
      return;
    }
    if (!permissionResponse.granted && permissionResponse.canAskAgain) {
      requestPermission().catch((err) => {
        console.warn("Media library permission request failed:", err);
      });
    }
  }, [isAndroidExpoGo, permissionResponse, requestPermission]);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    } else {
      alert("You did not select any image.");
    }
  };

  const onReset = () => {
    setShowAppOptions(false);
  };

  const onAddSticker = () => {
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  const onSaveImageAsync = async () => {
    if (isAndroidExpoGo) {
      alert(
        "Saving to the media library requires a development build on Android. See https://docs.expo.dev/develop/development-builds/create-a-build."
      );
      return;
    }

    try {
      const permission = permissionResponse?.granted
        ? permissionResponse
        : await requestPermission();
      if (!permission?.granted) {
        alert("Permission to access the media library is required to save.");
        return;
      }

      const localUri = await captureRef(imageRef, {
        height: 440,
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(localUri);
      if (localUri) {
        alert("Saved!");
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.imageContainer}>
        <View ref={imageRef} collapsable={false}>
          <ImageViewer
            imgSource={PlaceholderImage}
            selectedImage={selectedImage}
          />
          {pickedEmoji && (
            <EmojiSticker imageSize={40} stickerSource={pickedEmoji} />
          )}
        </View>
      </View>
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={onAddSticker} />
            <IconButton
              icon="save-alt"
              label="Save"
              onPress={onSaveImageAsync}
            />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button
            theme="primary"
            label="Choose a photo"
            onPress={pickImageAsync}
          />
          <Button
            label="Use this photo"
            onPress={() => setShowAppOptions(true)}
          />
        </View>
      )}
      <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
        <EmojiList onSelect={setPickedEmoji} onCloseModal={onModalClose} />
      </EmojiPicker>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
  optionsContainer: {
    position: "absolute",
    bottom: 80,
  },
  optionsRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
