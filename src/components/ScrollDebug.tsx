"use client";

import { useEffect, useState } from "react";

export default function ScrollDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkScroll = () => {
      const bodyStyles = window.getComputedStyle(document.body);
      const htmlStyles = window.getComputedStyle(document.documentElement);

      // Find all fixed elements with high z-index
      const allElements = document.querySelectorAll("*");
      const fixedElements: any[] = [];

      allElements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex);
        const position = styles.position;

        if ((position === "fixed" || position === "absolute") && zIndex > 0) {
          const rect = el.getBoundingClientRect();
          const coversFull =
            rect.width >= window.innerWidth * 0.9 &&
            rect.height >= window.innerHeight * 0.9;

          if (coversFull && zIndex < 40) {
            fixedElements.push({
              tag: el.tagName,
              class: (el as HTMLElement).className,
              zIndex: zIndex,
              position: position,
            });
          }
        }
      });

      setDebugInfo({
        bodyOverflow: bodyStyles.overflow,
        bodyOverflowY: bodyStyles.overflowY,
        bodyPosition: bodyStyles.position,
        bodyHeight: bodyStyles.height,
        htmlOverflow: htmlStyles.overflow,
        htmlOverflowY: htmlStyles.overflowY,
        scrollHeight: document.body.scrollHeight,
        innerHeight: window.innerHeight,
        canScroll: document.body.scrollHeight > window.innerHeight,
        currentScrollY: window.scrollY,
        fixedElements: fixedElements,
      });
    };

    checkScroll();
    const interval = setInterval(checkScroll, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "15px",
        fontSize: "11px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "400px",
        maxHeight: "400px",
        overflow: "auto",
        borderTopLeftRadius: "8px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        🔍 Scroll Debug
      </h3>

      <div style={{ marginBottom: "10px" }}>
        <strong>Body:</strong>
        <br />
        overflow: {debugInfo.bodyOverflow}
        <br />
        overflow-y: {debugInfo.bodyOverflowY}
        <br />
        position: {debugInfo.bodyPosition}
        <br />
        height: {debugInfo.bodyHeight}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>HTML:</strong>
        <br />
        overflow: {debugInfo.htmlOverflow}
        <br />
        overflow-y: {debugInfo.htmlOverflowY}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Scroll Info:</strong>
        <br />
        scrollHeight: {debugInfo.scrollHeight}px
        <br />
        innerHeight: {debugInfo.innerHeight}px
        <br />
        canScroll: {debugInfo.canScroll ? "✅ YES" : "❌ NO"}
        <br />
        scrollY: {debugInfo.currentScrollY}px
      </div>

      {debugInfo.fixedElements && debugInfo.fixedElements.length > 0 && (
        <div style={{ color: "red" }}>
          <strong>⚠️ Potential blockers:</strong>
          <br />
          {debugInfo.fixedElements.map((el: any, i: number) => (
            <div key={i}>
              {el.tag} (z:{el.zIndex})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
