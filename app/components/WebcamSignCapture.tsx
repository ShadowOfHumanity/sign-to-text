"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WebcamCapture from "./WebcamCapture";
import { MdWavingHand } from "react-icons/md";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import Webcam from "react-webcam";
import determineFeatures, { letterDetected } from "../CoreLogic/DetermineFeatures";

  



async function initHandLandmarker() 
{
    const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    return HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
    });
}


const WebcamSignCapture = () => {

    const [isHoverCapture, setIsHoverCapture] = useState(false)
    const [isButtonClicked, setIsButtonClicked] = useState(false)
    const videoRef = useRef<Webcam>(null); // webcam element
    const handLandmarkerRef = useRef<HandLandmarker | null>(null); // AI instance

    const [alphabeticalLetterDetected, setAlphabeticalLetterDetected] = useState<string>("");
    const [displayCurrentLetter, setDisplayCurrentLetter] = useState<string>("");
    const [currentHandPos, setCurrentHandPos] = useState<{ x: number; y: number } | null>(null);

    const handleButtonClick = () => {
        console.log("Button clicked!");
        console.log("Current detected letter:", alphabeticalLetterDetected);
        console.log("Current hand position:", currentHandPos);
        
        // Only show if a letter is currently detected
        if (alphabeticalLetterDetected !== "" && currentHandPos) {
            console.log("Displaying letter at position:", currentHandPos);
            setDisplayCurrentLetter(alphabeticalLetterDetected);
            
            // Hide after 5 seconds
            setTimeout(() => {
                setDisplayCurrentLetter("");
            }, 5000);
        } else {
            console.log("Cannot display - missing letter or hand position");
        }
        
        // Trigger scale animation
        setIsButtonClicked(true);
        setTimeout(() => setIsButtonClicked(false), 300);
    };

    

    useEffect(() => {
        initHandLandmarker().then((landmarker) => {
            handLandmarkerRef.current = landmarker;
        });
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        const detectHands = () => {
            if (
                videoRef.current &&
                videoRef.current.video &&
                handLandmarkerRef.current
            ) {
                const video = videoRef.current.video;
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    const handLandmarker = handLandmarkerRef.current;
                    const results = handLandmarker.detectForVideo(video, Date.now());
                    
                    // Only process if hands are detected
                    if (results.landmarks && results.landmarks.length > 0) {
                        // results has landmarks (21 points/vectors for hand 1), handedness (left/right), and handedness score
                        const features = determineFeatures(results);
                        const detectedLetter = letterDetected(features);

                        // Only log and update when a letter is detected
                        if (detectedLetter !== "") {
                            console.log("Letter detected:", detectedLetter);
                            setAlphabeticalLetterDetected(detectedLetter);
                        }
                        // Note: We don't clear the letter immediately when not detected
                        // This gives the user time to click the button

                        setCurrentHandPos(features.landmarks[0] ? { x: features.landmarks[0].x, y: features.landmarks[0].y } : null);
                    } else {
                        // No hands detected, clear state
                        setCurrentHandPos(null);
                    }

                    // Process results (e.g., draw landmarks, recognize signs, etc.)
                }
            }
            animationFrameId = requestAnimationFrame(detectHands);
        };

        animationFrameId = requestAnimationFrame(detectHands);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
                <WebcamCapture ref={videoRef} onMouseEntered={() => setIsHoverCapture(true)} onMouseLeft={() => setIsHoverCapture(false)} />
                
                {/* Letter display overlaid on webcam near hand */}
                {displayCurrentLetter && currentHandPos && (
                    <div 
                        className="absolute px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-2xl shadow-lg pointer-events-none"
                        style={{
                            left: `${currentHandPos.x * 100}%`,
                            top: `${currentHandPos.y * 100}%`,
                            transform: 'translate(-50%, -120%)',
                        }}
                    >
                        {displayCurrentLetter}
                    </div>
                )}
            </div>
            <motion.div
                onMouseEnter={() => setIsHoverCapture(true)} 
                onMouseLeave={() => setIsHoverCapture(false)}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10"
                initial={{ y: 100, opacity: 0 }}
                animate={isHoverCapture ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                <motion.button
                    onClick={handleButtonClick}
                    animate={{ scale: isButtonClicked ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="bg-blue-300 text-black p-4 rounded-full shadow-lg cursor-pointer hover:bg-blue-400">
                    <MdWavingHand size={32} />
                </motion.button>
            </motion.div>
        </div>
    )
}

export default WebcamSignCapture