export async function persistUploadedImage<T extends { key: string }>(
  uploaded: T,
  persistReference: (key: string) => Promise<unknown>,
  removeIfUnreferenced: (key: string) => Promise<unknown>,
): Promise<T> {
  try {
    await persistReference(uploaded.key);
    return uploaded;
  } catch (persistError) {
    try {
      await removeIfUnreferenced(uploaded.key);
    } catch (cleanupError) {
      throw new Error(
        "The image upload succeeded, but saving its database reference failed and safe cleanup could not be confirmed. Check storage management for an orphaned upload.",
        { cause: new AggregateError([persistError, cleanupError]) },
      );
    }
    throw persistError;
  }
}
