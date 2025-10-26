import { useEffect, useState } from 'react';

export interface BatteryStatus {
  level: number; // 0-1
  charging: boolean;
  supported: boolean;
}

// Battery Manager interface (not in all browsers)
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export function useBattery(): BatteryStatus {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 1,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    let batteryManager: BatteryManager | null = null;

    const updateBattery = (manager: BatteryManager) => {
      setBattery({
        level: manager.level,
        charging: manager.charging,
        supported: true,
      });
    };

    const nav = navigator as NavigatorWithBattery;
    if (nav.getBattery) {
      nav.getBattery().then((manager) => {
        batteryManager = manager;
        updateBattery(manager);

        // Listen for battery changes
        manager.onlevelchange = () => updateBattery(manager);
        manager.onchargingchange = () => updateBattery(manager);
      }).catch(() => {
        // Battery API not supported
        setBattery({ level: 1, charging: false, supported: false });
      });
    }

    return () => {
      if (batteryManager) {
        batteryManager.onlevelchange = null;
        batteryManager.onchargingchange = null;
      }
    };
  }, []);

  return battery;
}

export function getBatteryIcon(level: number, charging: boolean): string{
    if(charging) return '🔌';
    if(level > 0.75) return '🔋';
    if(level > 0.5) return '🔋';
    if(level > 0.25) return '🪫';
    return '🪫';
}

export function getBatteryColor(level: number, charging: boolean): string {
    if(charging) return 'text-blue-600';
    if(level > 0.5) return 'text-green-600';
    if(level > 0.25) return 'text-yellow-600';
    return 'text-red-600'; 
}

export function getBatteryPercentage(level: number): string{
    return `${Math.round(level * 100)}%`;
}