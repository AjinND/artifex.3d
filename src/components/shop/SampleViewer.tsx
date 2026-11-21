"use client";
import { useEffect, useRef, useState } from "react";
import ModelView from "./ModelView";
import styles from "./studio.module.css";

export default function SampleViewer() {
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const viewer = useRef<
    HTMLElement & { cameraOrbit: string; fieldOfView: string; loaded?: boolean }
  >(null);

  useEffect(() => {
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setError("Could not load the model viewer.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    const fail = () => setError("Could not load the studio model.");
    const finish = () => setLoaded(true);
    element.addEventListener("error", fail);
    element.addEventListener("load", finish);
    if (element.loaded) finish();
    return () => {
      element.removeEventListener("error", fail);
      element.removeEventListener("load", finish);
    };
  }, [ready, attempt]);

  return (
    <section aria-label="3D model preview">
      <div className={styles.sampleStage} aria-busy={!loaded && !error}>
        {ready && !error && (
          <ModelView
            key={attempt}
            viewer={viewer}
            src="/api/staff/sample"
            alt="Balancing Form studio model"
          />
        )}
        {error ? (
          <div className={styles.sampleMessage}>
            <span role="alert">{error}</span>
            <button
              className="shop-secondary"
              onClick={() => {
                setError("");
                setLoaded(false);
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          !loaded && (
            <div className={styles.sampleMessage} role="status">
              Loading 3D preview…
            </div>
          )
        )}
      </div>
      <div className={styles.sampleControls}>
        <span>Rotate and zoom to inspect the form.</span>
        <button
          className="shop-secondary"
          disabled={!loaded || !!error}
          onClick={() => {
            if (viewer.current) {
              viewer.current.cameraOrbit = "auto auto auto";
              viewer.current.fieldOfView = "auto";
            }
          }}
        >
          Reset view
        </button>
      </div>
    </section>
  );
}
