import React from 'react';
import { Coffee, FileCode2 } from 'lucide-react';
import type { JavaExportFormat, JavaExportOptions, JavaVersion } from '../types/export';

export interface JavaExportSettingsProps {
  options: JavaExportOptions;
  onChange: (options: JavaExportOptions) => void;
}

const FORMATS: { id: JavaExportFormat; title: string; badge?: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'spring-boot-batch',
    title: 'Spring Boot Batch Project Scaffold',
    badge: 'Recommended',
    description:
      'A complete Maven project: pom.xml, Spring Boot Batch 3.x configuration, application.yml, the Application class and the converted Tasklet and Model classes.',
    icon: <Coffee className="w-4 h-4" />,
  },
  {
    id: 'java-sources',
    title: 'Standalone Java Source Files',
    description: 'Only the plain .java files with their package folders (cobolprogramclasses/...).',
    icon: <FileCode2 className="w-4 h-4" />,
  },
];

export const JavaExportSettings: React.FC<JavaExportSettingsProps> = ({ options, onChange }) => {
  const set = <K extends keyof JavaExportOptions>(key: K, value: JavaExportOptions[K]) =>
    onChange({ ...options, [key]: value });
  const scaffold = options.format === 'spring-boot-batch';

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. SELECT OUTPUT FORMAT
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose the format that fits how you will build and run the converted programs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {FORMATS.map((format) => {
            const active = options.format === format.id;
            return (
              <div
                key={format.id}
                onClick={() => set('format', format.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  active
                    ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {format.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">{format.title}</h3>
                        {format.badge && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                            {format.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{format.description}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="javaOutputFormat"
                    aria-label={format.title}
                    checked={active}
                    onChange={() => set('format', format.id)}
                    className="text-blue-600 mt-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. FRAMEWORK & TARGET SETTINGS
          </label>
          <p className="text-xs text-slate-500 mt-0.5">Specify the Java version, build tool and what ships with the code.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Target Framework Version</span>
            <select
              aria-label="Target Framework Version"
              value={options.javaVersion}
              disabled={!scaffold}
              onChange={(e) => set('javaVersion', e.target.value as JavaVersion)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="17">Java 17 LTS (Spring Boot 3.3.x)</option>
              <option value="21">Java 21 LTS (Spring Boot 3.3.x)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Build Tool</span>
            <input
              type="text"
              disabled
              value="Apache Maven 3.9+ (pom.xml pre-configured)"
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-medium cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          {(
            [
              ['includeJUnitTests', 'Include JUnit 5 Automated Unit Tests (*Test.java)'],
              ['includeEntrypoint', 'Include Spring Boot Batch Application Entrypoint & Runners'],
              ['includeReadme', "Include Maven Quickstart documentation (README.md with 'mvn clean compile')"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={options[key]}
                disabled={!scaffold}
                onChange={(e) => set(key, e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-800 font-medium">{label}</span>
            </label>
          ))}
          {!scaffold && (
            <p className="text-[11px] text-slate-500">These settings apply to the Spring Boot Batch project scaffold only.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default JavaExportSettings;
