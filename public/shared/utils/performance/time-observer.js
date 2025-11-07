export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  const units = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
    { label: "sec", seconds: 1 },
  ];
  for (let unit of units) {
    const value = Math.floor(diff / unit.seconds);
    if (value > 0) return `${value} ${unit.label}${value !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function shouldUseSecondInterval(timestamp) {
  return Math.floor((Date.now() - timestamp) / 1000) < 60;
}

function createUpdateFunction(target, timestamp) {
  return () => {
    target.textContent = getRelativeTime(timestamp);
  };
}

function createIntervalForTarget(target, timestamp) {
  const updateTime = createUpdateFunction(target, timestamp);
  updateTime();
  let interval;
  const secondsSince = Math.floor((Date.now() - timestamp) / 1000);
  if (secondsSince < 60) {
    interval = setInterval(() => {
      const newDiff = Math.floor((Date.now() - timestamp) / 1000);
      updateTime();
      if (newDiff >= 60) {
        clearInterval(interval);
        interval = setInterval(updateTime, 60000);
        target._intervalId = interval;
      }
    }, 1000);
  } else {
    interval = setInterval(updateTime, 60000);
  }
  target._intervalId = interval;
}

function clearTargetInterval(target) {
  const intervalId = target._intervalId;
  if (intervalId) {
    clearInterval(intervalId);
    target._intervalId = null;
  }
}

function handleEntry(entry) {
  const { target } = entry;
  const intervalId = target._intervalId;
  if (entry.isIntersecting) {
    if (!intervalId) {
      const timestamp = target._timestamp;
      createIntervalForTarget(target, timestamp);
    }
  } else {
    if (intervalId) {
      clearTargetInterval(target);
    }
  }
}

function createTimeObserver() {
  let observer;
  try {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(handleEntry);
      },
      {
        threshold: 0.1,
      }
    );
  } catch (error) {
    console.error("IntersectionObserver error:", error);
    observer = {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  }
  return observer;
}

export const timeObserver = createTimeObserver();
