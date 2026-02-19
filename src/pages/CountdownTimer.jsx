import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSessionExpired } from "../store/step4Slice";
import { setStep } from "../store/step1Slice";

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function CountdownTimer({ startSeconds = 180 }) {
  const dispatch = useDispatch();
  const sessionExpired = useSelector((state) => state.step4.session_expired);
  const step = useSelector((state) => state.step1.step);
  const [time, setTime] = useState(startSeconds);
  const [running, setRunning] = useState(true);

  // Reset timer when entering payment step
  useEffect(() => {
    if (step === "paymentstep" && !sessionExpired) {
      setTime(startSeconds);
      setRunning(true);
    }
  }, [step, sessionExpired, startSeconds]);

  const reinitiate = () => {
    dispatch(setStep("checkoutstep"));
  };

  useEffect(() => {
    if (!sessionExpired && step == "paymentstep") {
      let interval;

      if (running && time > 0) {
        interval = setInterval(() => {
          setTime((t) => t - 1);
        }, 1000);
      }

      if (time === 0) {
        setRunning(false);
        dispatch(setSessionExpired(true));
      }

      return () => clearInterval(interval);
    }
  }, [running, time, step]);
  return (
    <div>
      <h4>
        {running && !sessionExpired
          ? `Session ends in ${formatTime(time)}`
          : "Session expired!"}
      </h4>
      {sessionExpired && (
        <input
          type="button"
          className="btn-primary"
          value="Re-initiate Payment"
          onClick={() => reinitiate()}
        />
      )}
    </div>
  );
}
