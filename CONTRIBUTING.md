# Contributing to Tyk FAPI Accelerator

Thank you for considering contributing to the Tyk FAPI Accelerator! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- A detailed description of the issue
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment information (OS, browser, etc.)

### Suggesting Enhancements

If you have an idea for an enhancement, please create an issue with the following information:

- A clear, descriptive title
- A detailed description of the enhancement
- Any relevant examples or mockups
- Why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies
3. Follow the setup instructions in the README.md

### Working with the Monorepo

This project is structured as a monorepo with multiple Go modules. When working on a specific component:

1. Navigate to the component's directory
2. Use the component's go.mod file for dependencies
3. Run tests specific to that component

For working with multiple components simultaneously, use the go.work file at the root of the repository.

### Coding Standards

- Follow Go best practices and style guidelines
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation as needed

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.