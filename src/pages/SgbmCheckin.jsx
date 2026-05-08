import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../Utils/Interceptor";
import { swalError } from "../Utils/Functions";
import Cropper from "react-easy-crop";
import jsQR from "jsqr";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import {
  ArrowRight,
  Camera,
  FileText,
  History,
  Image,
  Info,
  Play,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { setBookingkey } from "../store/step3Slice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function createImage(source) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Unable to load image.")),
    );
    image.src = source;
  });
}

async function getCroppedCanvas(imageSource, cropPixels) {
  const image = await createImage(imageSource);
  const canvas = document.createElement("canvas");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to prepare cropped image canvas.");
  }

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  return canvas;
}

export default function SgbmCheckin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.step1.loading);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const scanRafRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningActiveRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [scannerMessage, setScannerMessage] = useState("Camera Ready");
  const [scannerError, setScannerError] = useState("");
  const [lastScanAt, setLastScanAt] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceType, setCropSourceType] = useState("image");
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState("idle"); // idle | verifying | checking-in | success | error | invalid | already-checked-in
  const [apiMessage, setApiMessage] = useState("");

  const canUseBarcodeDetector = useMemo(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
    [],
  );

  const stopScanner = useCallback((options = {}) => {
    const keepSuccessMessage = Boolean(options.keepSuccessMessage);

    scanningActiveRef.current = false;

    if (scanRafRef.current) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);

    if (!keepSuccessMessage) {
      setScannerMessage("Scanner stopped");
    }
  }, []);

  const closeCropModal = useCallback(() => {
    if (isUploadProcessing) return;
    setIsCropModalOpen(false);
    setCropSource("");
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [isUploadProcessing]);

  const openCropModal = useCallback((source, sourceType) => {
    setCropSource(source);
    setCropSourceType(sourceType);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropModalOpen(true);
  }, []);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const processScannedCode = useCallback(
    async (value) => {
      if (!value) return;

      try {
        setApiStatus("verifying");
        setApiMessage("Verifying QR code...");

        const { data: verifyData } = await axiosInstance.post(
          "/qr-verification",
          {
            booking_key: value,
          },
        );
        console.log("Verification response:", verifyData);
        if (!verifyData?.status) {
          setApiStatus("invalid");
          setApiMessage(verifyData?.message || "Invalid QR code.");
          return;
        }

        if (verifyData?.status) {
          setApiStatus("success");
          setApiMessage(verifyData?.message || "Check-in successful!");
          console.log("Check-in successful for booking key:", value);
          dispatch(setBookingkey(value));
          navigate("/checkin-thankyou");
          return;
        }
      } catch (error) {
        console.error("QR processing error:", error);
        setApiStatus("error");
        setApiMessage(
          error?.response?.data?.message ||
            "An error occurred. Please try again.",
        );
        swalError(error);
      }
    },
    [dispatch, navigate],
  );

  const decodeFromCanvas = useCallback(
    async (canvas) => {
      if (canUseBarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector({
            formats: ["qr_code", "data_matrix"],
          });
          const codes = await detector.detect(canvas);
          if (codes.length > 0 && codes[0]?.rawValue) {
            return codes[0].rawValue;
          }
        } catch (error) {
          console.error("BarcodeDetector decode failed on upload:", error);
        }
      }

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        return "";
      }

      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(frame.data, canvas.width, canvas.height, {
        inversionAttempts: "attemptBoth",
      });

      return qr?.data || "";
    },
    [canUseBarcodeDetector],
  );

  const handleReadCrop = useCallback(async () => {
    if (!cropSource || !croppedAreaPixels || isUploadProcessing) return;

    try {
      setIsUploadProcessing(true);
      setScannerError("");
      setScanResult("");
      setScannerMessage("Reading cropped area...");
      stopScanner();

      const croppedCanvas = await getCroppedCanvas(
        cropSource,
        croppedAreaPixels,
      );
      const detectedValue = await decodeFromCanvas(croppedCanvas);

      if (!detectedValue) {
        setScannerError(
          "No QR/Data Matrix code found in this crop. Try selecting a tighter area around the code.",
        );
        setScannerMessage("No code found");
        return;
      }

      setScanResult(detectedValue);
      setLastScanAt(new Date());
      setScannerMessage(
        cropSourceType === "pdf"
          ? "Scan complete from cropped PDF"
          : "Scan complete from cropped image",
      );
      setApiStatus("idle");
      setApiMessage("");
      closeCropModal();
      processScannedCode(detectedValue);
    } catch (error) {
      console.error("Unable to decode cropped source:", error);
      setScannerError("Unable to read selected crop. Please try again.");
      setScannerMessage("Scan failed");
    } finally {
      setIsUploadProcessing(false);
    }
  }, [
    closeCropModal,
    cropSource,
    croppedAreaPixels,
    cropSourceType,
    decodeFromCanvas,
    isUploadProcessing,
    processScannedCode,
    stopScanner,
  ]);

  const handleImageUploadClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handlePdfUploadClick = useCallback(() => {
    pdfInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      stopScanner();
      setScannerError("");
      setScannerMessage("Preparing image crop...");

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          openCropModal(reader.result, "image");
          setScannerMessage("Crop image and read code");
        }
      };
      reader.onerror = () => {
        setScannerError("Unable to load image file.");
      };

      reader.readAsDataURL(file);
    },
    [openCropModal, stopScanner],
  );

  const convertPdfToImage = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const documentTask = getDocument({
      data: buffer,
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    const pdf = await documentTask.promise;

    if (!pdf.numPages) {
      throw new Error("PDF has no pages.");
    }

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to render PDF.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;

    return canvas.toDataURL("image/png");
  }, []);

  const handlePdfSelected = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      try {
        setIsUploadProcessing(true);
        stopScanner();
        setScannerError("");
        setScannerMessage("Preparing PDF page for crop...");

        const pdfPreviewImage = await convertPdfToImage(file);
        openCropModal(pdfPreviewImage, "pdf");
        setScannerMessage("Crop PDF and read code");
      } catch (error) {
        console.error("Unable to process uploaded PDF:", error);
        setScannerError("Unable to process PDF. Please upload a valid file.");
      } finally {
        setIsUploadProcessing(false);
      }
    },
    [convertPdfToImage, openCropModal, stopScanner],
  );

  const startScanner = useCallback(async () => {
    if (isScanning) return;

    try {
      setScannerError("");
      setScanResult("");
      setScannerMessage("Starting camera...");
      setApiStatus("idle");
      setApiMessage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      detectorRef.current = null;

      if (canUseBarcodeDetector) {
        let requestedFormats = ["qr_code", "data_matrix"];

        if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
          const supportedFormats =
            await window.BarcodeDetector.getSupportedFormats();
          requestedFormats = requestedFormats.filter((format) =>
            supportedFormats.includes(format),
          );
        }

        if (requestedFormats.length > 0) {
          detectorRef.current = new window.BarcodeDetector({
            formats: requestedFormats,
          });
        }
      }

      setIsScanning(true);
      scanningActiveRef.current = true;
      setScannerMessage("Scanning...");

      const detect = async () => {
        if (!scanningActiveRef.current || !videoRef.current) {
          return;
        }

        try {
          let detectedValue = "";

          if (detectorRef.current) {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length > 0) {
              detectedValue = codes[0].rawValue || "Code detected";
            }
          } else {
            const videoEl = videoRef.current;
            const width = videoEl.videoWidth;
            const height = videoEl.videoHeight;

            if (width > 0 && height > 0) {
              if (!canvasRef.current) {
                canvasRef.current = document.createElement("canvas");
              }

              const canvas = canvasRef.current;
              const context = canvas.getContext("2d", {
                willReadFrequently: true,
              });

              if (context) {
                canvas.width = width;
                canvas.height = height;
                context.drawImage(videoEl, 0, 0, width, height);

                const frame = context.getImageData(0, 0, width, height);
                const result = jsQR(frame.data, width, height, {
                  inversionAttempts: "dontInvert",
                });

                if (result?.data) {
                  detectedValue = result.data;
                }
              }
            }
          }

          if (detectedValue) {
            const value = detectedValue;
            setScanResult(value);
            setLastScanAt(new Date());
            setScannerMessage("Scan complete");
            stopScanner({ keepSuccessMessage: true });
            processScannedCode(value);
            return;
          }
        } catch (err) {
          console.error("Scanner detection error:", err);
        }

        scanRafRef.current = requestAnimationFrame(detect);
      };

      scanRafRef.current = requestAnimationFrame(detect);
    } catch (error) {
      console.error("Unable to start scanner:", error);
      setScannerError(
        "Unable to access camera. Please allow permission and try again.",
      );
      stopScanner();
    }
  }, [canUseBarcodeDetector, isScanning, processScannedCode, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const lastScanLabel = useMemo(() => {
    if (!lastScanAt) return "Never";
    const elapsedSeconds = Math.floor(
      (Date.now() - lastScanAt.getTime()) / 1000,
    );

    if (elapsedSeconds < 60) return "just now";
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60)
      return `${elapsedMinutes} min${elapsedMinutes > 1 ? "s" : ""} ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    return `${elapsedHours} hr${elapsedHours > 1 ? "s" : ""} ago`;
  }, [lastScanAt]);

  return (
    <div className="fx-leftbar">
      <div className={`fx-fullscreen-loader ${loading ? "show" : "hide"}`}>
        <div className="fx-seg-loader"></div>
      </div>
      <div className="fx-leftcontentbox">
        <div className="fx-scanner-main-box">
          <header className="fx-header">
            <h1>Scan QR Code</h1>
            <p>
              Position the QR code within the frame to automatically scan and
              process the booking information.
            </p>
          </header>

          <div className="fx-card">
            <div className="fx-viewport-side">
              <div className="fx-system-status">
                <div
                  className={`fx-status-dot ${isScanning ? "active" : "idle"}`}
                ></div>
                {isScanning ? "System Active" : "System Idle"}
              </div>

              <div className="fx-video-container">
                <div className="fx-bracket fx-tl"></div>
                <div className="fx-bracket fx-tr"></div>
                <div className="fx-bracket fx-bl"></div>
                <div className="fx-bracket fx-br"></div>

                <video
                  id="fx-camera-feed"
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={isScanning ? "visible" : "hidden"}
                ></video>

                <div
                  className={`fx-placeholder-content ${isScanning ? "hidden" : "visible"}`}
                  id="fx-placeholder"
                >
                  <div className="fx-cam-icon-circle">
                    <Camera size={32} color="#475569" />
                  </div>
                  <p>{scannerMessage}</p>
                </div>
              </div>

              {scanResult ? (
                <p className="fx-scan-result" title={scanResult}>
                  Last code: {scanResult}
                </p>
              ) : null}

              {scannerError ? (
                <p className="fx-scanner-error">{scannerError}</p>
              ) : null}

              {apiStatus !== "idle" && (
                <div className={`fx-api-status fx-api-status--${apiStatus}`}>
                  {(apiStatus === "verifying" ||
                    apiStatus === "checking-in") && (
                    <div className="fx-api-spinner"></div>
                  )}
                  <p>{apiMessage}</p>
                </div>
              )}
            </div>

            <aside className="fx-controls-side">
              <div className="fx-controls-title">
                <SlidersHorizontal size={18} />
                <span>Controls</span>
              </div>

              {isScanning ? (
                <button
                  className="fx-btn fx-btn-stop"
                  id="fx-stop-scan"
                  onClick={() => stopScanner()}
                  type="button"
                >
                  <Square size={14} fill="currentColor" /> Stop Scanner
                </button>
              ) : (
                <button
                  className="fx-btn fx-btn-start"
                  id="fx-start-scan"
                  onClick={startScanner}
                  type="button"
                >
                  <Play size={16} /> Start Scanner
                </button>
              )}

              <div className="fx-or-divider">
                <span>OR</span>
              </div>

              <button
                className="fx-btn fx-btn-upload"
                type="button"
                onClick={handleImageUploadClick}
                disabled={isUploadProcessing}
              >
                <Image size={16} /> Upload Image
              </button>

              <button
                className="fx-btn fx-btn-upload"
                type="button"
                onClick={handlePdfUploadClick}
                disabled={isUploadProcessing}
              >
                <FileText size={16} /> Upload PDF
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="fx-hidden-input"
                onChange={handleImageSelected}
              />
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="fx-hidden-input"
                onChange={handlePdfSelected}
              />

              <div className="fx-info-note">
                <Info size={16} />
                <p>
                  Ensure adequate lighting and hold the code steady within the
                  frame for best results. Supported formats: QR, Data Matrix.
                </p>
              </div>
            </aside>
          </div>

          <footer className="fx-footer">
            <div>
              <History size={14} /> Last scan: <strong>{lastScanLabel}</strong>
            </div>
            <a href="#" className="fx-view-history">
              View History <ArrowRight size={14} />
            </a>
          </footer>

          {isCropModalOpen ? (
            <div
              className="fx-cropper-backdrop"
              role="dialog"
              aria-modal="true"
            >
              <div className="fx-cropper-modal">
                <div className="fx-cropper-head">
                  <h3>
                    {cropSourceType === "pdf"
                      ? "Crop PDF Area"
                      : "Crop Image Area"}
                  </h3>
                  <p>Select the code area, then click Read QR From Crop.</p>
                </div>

                <div className="fx-cropper-stage">
                  <Cropper
                    image={cropSource}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    showGrid={false}
                  />
                </div>

                <div className="fx-cropper-range">
                  <label htmlFor="fx-crop-zoom">Zoom</label>
                  <input
                    id="fx-crop-zoom"
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                </div>

                <div className="fx-cropper-actions">
                  <button
                    className="fx-btn fx-btn-upload"
                    type="button"
                    onClick={closeCropModal}
                    disabled={isUploadProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    className="fx-btn fx-btn-start"
                    type="button"
                    onClick={handleReadCrop}
                    disabled={isUploadProcessing || !croppedAreaPixels}
                  >
                    {isUploadProcessing ? "Reading..." : "Read QR From Crop"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
