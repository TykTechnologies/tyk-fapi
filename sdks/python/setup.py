from setuptools import setup, find_packages

setup(
    name="tyk-fapi",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "cryptography>=41.0.0",
        "requests>=2.28.0",
        "pyjwt>=2.6.0",
        "flask>=2.2.0",
        "python-dotenv>=1.0.0",
    ],
    author="Tyk Technologies",
    author_email="info@tyk.io",
    description="FAPI 2.0 Python SDK with DPoP support",
    keywords="fapi, oauth2, dpop, security",
    url="https://github.com/TykTechnologies/tyk-fapi",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
)