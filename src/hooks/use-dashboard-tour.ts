import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "ezyhelpers_dashboard_tour_done";

const useDashboardTour = () => {
  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (done) return;

    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: "hsl(222, 84%, 4.9%)",
        overlayOpacity: 0.6,
        popoverClass: "driverjs-theme",
        steps: [
          {
            element: "#kpi-cards",
            popover: {
              title: "KPI Overview",
              description: "See your key metrics at a glance — total leads, hot leads, conversion rate and more.",
              side: "bottom" as const,
            },
          },
          {
            element: "#drift-alerts",
            popover: {
              title: "Drift Alerts",
              description: "Set a daily target and get alerted when lead intake falls behind. Stay on track!",
              side: "bottom" as const,
            },
          },
          {
            element: "#chart-status",
            popover: {
              title: "Status Distribution",
              description: "Visualise the split between In-progress, Won and Lost leads.",
              side: "top" as const,
            },
          },
          {
            element: "#chart-priority",
            popover: {
              title: "Priority Breakdown",
              description: "See how many leads are Hot, Warm or Cold at a glance.",
              side: "top" as const,
            },
          },
          {
            element: "#chart-ageing",
            popover: {
              title: "Lead Ageing",
              description: "Identify stale leads. Green (0-3d), Amber (4-7d), Red (8+ days).",
              side: "top" as const,
            },
          },
          {
            element: "#chart-sales",
            popover: {
              title: "Sales Performance",
              description: "Compare how each sales person is performing across leads.",
              side: "top" as const,
            },
          },
          {
            element: "#chart-trend",
            popover: {
              title: "Daily Trend",
              description: "Track your daily lead intake over the past 14 days.",
              side: "top" as const,
            },
          },
          {
            element: "#export-png-btn",
            popover: {
              title: "Export Dashboard",
              description: "Download the entire dashboard as a PNG image for reports and sharing.",
              side: "left" as const,
            },
          },
        ],
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, "true");
        },
      });

      driverObj.drive();
    }, 800);

    return () => clearTimeout(timeout);
  }, []);
};

export default useDashboardTour;
