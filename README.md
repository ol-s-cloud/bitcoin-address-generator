Introduction
------------

This repository explores the use of randomly generated hexadecimal numbers to create a bitcoin wallet address using the Elliptic Curve Digital Signature Algorithm.
Supposing Alice wants to buy a book from Bob. After all has been agreed and done, Bob needs to provide Alice witha bitcoin wallet address where the payments will be deposited to. The transaction will be done on the blockchain so Bob needs a bitcoin wallet wallet address to receive payments. This repository covers how a bitcoin wallet address can be created from randomly generated private keys. 

In cryptography, the Elliptic Curve Digital Signature Algorithm (ECDSA) offers a variant of the Digital Signature Algorithm (DSA) which uses elliptic-curve cryptography.



## Method

Bob signs a hash of a message with his private key, and then then Alice proves with his public key. Bob also uses a random nonce value for the signature (K)

![ecdsa_new](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/3311cd8a-cebb-465e-bea8-91fcf7ffb39d)

With ECDSA, Alice will sign a message with her private key, and then Bob will use her public key to verify that she signed the message (and that the message has now changed)
![ecdsa](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/e062bc0a-fc16-4203-a0fa-c0844cb995df)


I have uploaded a document here that explains the process further to serve as a technical documentation and user guide `here <https://>`_.

Diagram below illustrates the architecture and how the Bitcoin wallet addresses are created.

  ![Screenshot 2024-04-02 235506](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/5c530686-c50a-4a00-bce7-3d1be3462d99)


Setting Up Our Environment
------------
To achieve desired outcome, first we need to set-up the environment. For the purpose of this report, we shall be working with the Google Collab environment - https://colab.research.google.com/ which allows the creation of digital notebooks that write executable python codes through a web browser while for getting our randomly generated private keys, we shall be working with private keys available from wallet address details randomly created via - https://www.bitaddress.org - Open-Source JavaScript Client-Side Bitcoin Wallet Generator. 
 
This option is considered for this report as it is important to ascertain that the written codes and followed procedures are correct, can produce a verifiable bitcoin address & illustrate how the wallet addresses were created in addition to the private key provider 
(bitaddress.org) being an open source & peer reviewed software as recommended by the bitcoin technical document. However, in the event where only the required hexadecimal numbers are required to create a new bitcoin address, other online generators of hexadecimal private keys can be considered.  
An example is https://www.browserling.com/tools/random-hex - which 
can be used to generate hexadecimal digits that can serve as the private key and only the creator will know these details. Take note to ensure the bitcoin private key criteria are met which is a 64-digit Hexadecimal number. 


## Python Libraries & Dependencies

•	**ECDSA Python Library** -  An easy-to-use implementation of the Elliptic Curve 
Cryptography that allows us to perform the first operation in illustrated in Fig 1 
(Conversion of Private private key to public key). The ECDSA (Elliptic Curve Digital 
Signature Algorithm) library is used to implement the functionality that allows bitcoin addresses create key pairs (signing key and verifying key), sign messages, and verify the signatures. We install this by typing the following line of codes in the digital notebook environment – pip install ecdsa  
 
•	**Hashlib** – This module contains the hash algorithm and libraries required to perform SHA256, RIPEMD160 and other hashing functions as contained in fig 2. By typing the commands – import hashlib on the next line, this feature gets imported into the notebook environment. It is installed on the python environment by default. 
 
•	**Codecs** – Codecs are python modules that defines base classes and allows for the encoding and decoding within the python environment. Typing import codecs on the next line, this module gets imported into the digital notebook environment. 
 
•	**Base58** – This implementation is used in the bitcoin address and bitcoin network for converting the byte -string format address to a Base58 string using the Base58Check encoding which has become the globally known standard of bitcoin addresses. As this is not a default module of the python environment, it is installed by typing pip install base58 into the next line. 


## Requirements

Ensure the notebook environment is running and all dependencies are fully set up and installed 

```
pip install ecdsa
import hashlib
import codecs
pip install base58
import ecdsa 
import base 58 

```

To go through my lines of codes please see my `jupyter notebook here  <https://colab.research.google.com/drive/1d26u6FgGqRcBdL1_Bc6FwLfKJ2c6lWJ3#scrollTo=nqHM84fk7s2b/>`


## Documentation

[Step By Step Guide](https://linktodocumentation)


## Feedback

If you have any feedback, please reach out to me os.sg@icloud.com

## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.



## Love to read more? Here are some resources & references

 - [Bitcoin Technical Document]( https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)
 - [List of Addresses Prefixes]([[https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project](https://pypi.org/project/ecdsa/](https://en.bitcoin.it/wiki/List_of_address_prefixes)
 - [Elliptic Curve Digital Signature Algorithm]([https://github.com/matiassingers/awesome-readme](https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm )
 - [ECDSA Python Library]([https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project](https://pypi.org/project/ecdsa/ )


## Jupyter Notebook

[Technical Step By Step Guide](https://linktodocumentation)

## License

[MIT](https://choosealicense.com/licenses/mit/)

