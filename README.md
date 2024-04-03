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




Diagram below illustrates the architecture and how the Bitcoin wallet addresses are created.

  ![Screenshot 2024-04-02 235506](https://github.com/ol-s-cloud/bitcoin-address-generator/assets/134246135/5c530686-c50a-4a00-bce7-3d1be3462d99)


Setting Up Our Environment
------------


## Python Libraries & Dependencies

- Light/dark mode toggle
- Live previews
- Fullscreen mode
- Cross platform

## Requirements

Install my-project with npm

```bash
  npm install my-project
  cd my-project
```

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
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)

## License

[MIT](https://choosealicense.com/licenses/mit/)

