# Modernization Pipeline Architecture Guide

This document details the multi-stage code modernization workflow in ALSM Web Frontend.

## Workflow Stages
1. **Source Ingestion (Upload)**:
   - Validates file extensions based on project `conversionType`.
   - Supports BMS/DSPF for frontend projects (`.bms`, `.dspf`).
   - Supports COBOL/RPG for backend projects (`.cob`, `.cbl`, `.cpy`).
2. **Target Code Generation (Convert)**:
   - Runs deterministic conversion adapters.
   - Generates React TypeScript components or Java Spring Boot services.
3. **AI Semantic Validation**:
   - Performs discrepancy detection between legacy source and modern target code.
   - Categorizes issues using the BMS semantic taxonomy.
   - Generates automated remediation code patches.
4. **Interactive Review & Code Remediations**:
   - Single-click "Accept AI Fix" patches the code in real-time.
   - "Accept All AI Fixes" batches remediations sequentially.
   - Transitions findings directly from `PENDING` to `RESOLVED`.
5. **Modernization Package Export**:
   - Bundles generated components, styles, configurations, and field mappings into a downloadable zip package.
