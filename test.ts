// deno-lint-ignore-file require-await
import { MongoClient, ObjectId } from "./mod.ts";
import { assertEquals, deferred } from "./test_deps.ts";

Deno.test("Sample Test", async () => {
  const fetchMock = deferred<{ url: string; init: RequestInit }>();

  const client = new MongoClient({
    endpoint: "https://data.mongodb-api.com/app/data-abc/endpoint/data/v1",
    dataSource: "dataSource",
    auth: {
      apiKey: "API_KEY",
    },
    fetch: (async (url: string, init: RequestInit) => {
      fetchMock.resolve({ url, init });
      return {
        ok: true,
        text: async () => (JSON.stringify({ ok: true })),
      };
    }) as typeof fetch,
  });

  const _id = new ObjectId();
  client.database("db-name").collection("c-name").insertOne({
    _id,
    foo: "bar",
  });

  const { url, init } = await fetchMock;
  assertEquals(
    url,
    "https://data.mongodb-api.com/app/data-abc/endpoint/data/v1/action/insertOne",
  );
  assertEquals(init.method, "POST");
  assertEquals(
    new Headers(init.headers).get("Content-Type"),
    "application/ejson",
  );
  assertEquals(new Headers(init.headers).get("api-key"), "API_KEY");
  assertEquals(
    await new Request(url, init).json(),
    {
      collection: "c-name",
      database: "db-name",
      dataSource: "dataSource",
      document: {
        _id: {
          $oid: _id.toHexString(),
        },
        foo: "bar",
      },
    },
  );
});
