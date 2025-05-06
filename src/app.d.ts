declare namespace App {

   interface Platform {
       env: {
           COUNTER: DurableObjectNamespace;
       };
       context: {
           waitUntil(promise: Promise): void;
       };
       caches: CacheStorage & { default: Cache }
   }

}