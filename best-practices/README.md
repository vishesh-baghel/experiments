# Best Practices Collection

This directory contains curated best practices and optimization guides for various technologies, designed to help developers write better, more performant code.

## Overview

Each technology-specific subdirectory includes:
- Comprehensive documentation and guides
- Rule-based best practices with examples
- Build tools for compiling and validating content
- Test cases for LLM evaluation
- Configuration files for easy setup

## Available Technologies

### React (`react/`)
Performance optimization guide from Vercel Engineering, containing 40+ rules across 8 categories prioritized from critical to incremental impact. Perfect for AI agents and developers maintaining React/Next.js codebases.

**Key Topics:**
- Eliminating async waterfalls
- Bundle size optimization
- Server-side and client-side performance
- Re-render optimization
- JavaScript performance patterns

**Quick Start:**
```bash
cd react
pnpm install
pnpm build        # Compile rules into AGENTS.md
pnpm validate     # Validate rule files
```

See `react/README.md` for detailed documentation.

## Structure

Each technology directory follows a consistent structure:

```
technology-name/
├── AGENTS.md           # Compiled best practices guide (generated)
├── README.md           # Getting started and overview
├── SKILL.md            # Skill-specific documentation
├── metadata.json       # Document metadata
├── package.json        # Dependencies and build scripts
├── test-cases.json     # LLM evaluation tests (generated)
├── rules/              # Individual rule files
│   ├── _sections.md    # Section metadata
│   ├── _template.md    # Template for new rules
│   └── *.md            # Individual rule files
└── src/                # Build scripts and utilities
    ├── build.ts        # Compiles rules into AGENTS.md
    ├── validate.ts     # Validates rule structure
    └── ...
```

## Adding New Technologies

To add a new technology best practices guide:

1. Create a new directory: `mkdir best-practices/<technology-name>`
2. Follow the structure pattern from existing technologies
3. Include comprehensive documentation
4. Add build scripts if needed for compilation
5. Update this README with the new technology

## Usage

### For Developers
Navigate to the specific technology directory and follow its README for setup and usage instructions.

### For AI Agents
The `AGENTS.md` file in each technology directory contains the complete, optimized guide for LLM consumption. These files are auto-generated from individual rules and prioritized for maximum impact.

## Contributing

When adding or updating best practices:

1. Follow the existing structure and patterns
2. Include clear examples (incorrect vs. correct code)
3. Prioritize rules by impact (CRITICAL, HIGH, MEDIUM, LOW)
4. Run validation and build scripts before committing
5. Update documentation accordingly

## Credits

- **React Best Practices**: Originally created by Shuding at Vercel ([source](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices))

## License

Each technology guide maintains its original license. Refer to individual directories for specific licensing information.
