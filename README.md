# Jeffpardy

You'll need to contact Jeff for some keys for this to work.  Right now, the app won't load without a connection to the blob store.

To work on the service:

1. Make sure you have a key for the Azure blob store for the questions.
1. Store the secret in the local cache:
    ```
    dotnet user-secrets set "BlobConnectionString" "[string from Azure Portal]"
    ```

To work on the web UX:

1. open the project in VS and start in debug mode.
1. npm run build
1. npm run scss
