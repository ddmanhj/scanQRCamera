import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const [data, setData] = useState("");

  useEffect(() => {
    const initializeScanner = async () => {
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            console.log(
              `Actual video size: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
            );
          }
        };
      }

      const exactConstraints = {
        video: {
          facingMode: { exact: "environment" }, // Request the rear camera
          width: { exact: 1920 },
          height: { exact: 1080 },
          frameRate: { ideal: 60, min: 30 },
        },
      };

      const fallbackConstraints = {
        facingMode: { ideal: "environment" }, // Fallback to rear camera if available
        video: {
          width: { min: 1920, ideal: 1920 },
          height: { min: 1080, ideal: 1080 },
          frameRate: { ideal: 60, min: 30 },
        },
      };

      try {
        // **Attempt to get full HD stream with exact constraints**
        const stream = await navigator.mediaDevices.getUserMedia(
          exactConstraints
        );
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start decoding from the video stream
        await codeReader.current.decodeFromStream(
          stream,
          videoRef.current!,
          (result, err) => {
            if (result) {
              setData(result.getText());
              console.log(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              console.log(err);
            }
          }
        );
      } catch (error) {
        console.log(
          "Exact constraints failed, trying fallback constraints:",
          error
        );

        try {
          // **Fallback to min and ideal constraints if exact fails**
          const stream = await navigator.mediaDevices.getUserMedia(
            fallbackConstraints
          );
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }

          // Start decoding from the video stream
          await codeReader.current.decodeFromStream(
            stream,
            videoRef.current!,
            (result, err) => {
              if (result) {
                setData(result.getText());
                console.log(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                console.log(err);
              }
            }
          );
        } catch (fallbackError) {
          console.log("Fallback constraints failed:", fallbackError);
        }
      }
    };

    initializeScanner();

    return () => {
      codeReader.current.reset();
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
    };
  }, []);

  return (
    <>
      <video ref={videoRef} style={{ width: "100%", height: "400px" }}></video>
      <p>result: {data}</p>
    </>
  );
}

export default App;
