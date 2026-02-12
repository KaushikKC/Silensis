"use client";

import { MIN_LEVERAGE, MAX_LEVERAGE } from "@/lib/constants";

interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const presets = [1, 2, 5, 10, 50];

export function LeverageSlider({ value, onChange }: LeverageSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-500">Leverage</label>
        <span className="text-sm font-bold text-gray-900">{value}x</span>
      </div>

      <input
        type="range"
        min={MIN_LEVERAGE}
        max={MAX_LEVERAGE}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:cursor-pointer"
      />

      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
              value === p
                ? "bg-accent text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p}x
          </button>
        ))}
      </div>
    </div>
  );
}
