export async function fetchQuery<T>(
  query: string,
  variables: Record<string, string>,
): Promise<T> {
  const url = process.env.STRAPI_API_URL!;
  const token = process.env.STRAPI_API_TOKEN;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed GraphQL fetching");
  }
}
