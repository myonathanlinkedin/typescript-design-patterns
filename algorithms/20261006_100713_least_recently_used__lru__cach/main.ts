import { LRUCacheImpl } from './engine';
import { LRUCache } from './types';

/**
 * Simple assertion helper for testing.
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

/**
 * Runs a suite of unit tests for the LRU Cache implementation.
 */
function runTests(): void {
  console.log("Running LRU Cache Unit Tests...\n");

  // Test 1: Basic Put and Get
  {
    const cache = new LRUCacheImpl<string, number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    
    assert(cache.get("a") === 1, "Test 1a: Get existing key 'a' returns 1");
    assert(cache.get("b") === 2, "Test 1b: Get existing key 'b' returns 2");
    assert(cache.get("c") === null, "Test 1c: Get non-existent key 'c' returns null");
    assert(cache.size === 2, "Test 1d: Size is 2 after two puts");
    console.log("");
  }

  // Test 2: Eviction of Least Recently Used
  {
    const cache = new LRUCacheImpl<string, number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    
    // Access 'a' to make it most recently used
    cache.get("a");
    
    // Add 'c', which should evict 'b' (least recently used)
    cache.put("c", 3);
    
    assert(cache.get("a") === 1, "Test 2a: 'a' is still present (was recently used)");
    assert(cache.get("b") === null, "Test 2b: 'b' was evicted (least recently used)");
    assert(cache.get("c") === 3, "Test 2c: 'c' is present");
    assert(cache.size === 2, "Test 2d: Size remains 2");
    console.log("");
  }

  // Test 3: Update Existing Key
  {
    const cache = new LRUCacheImpl<string, number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    
    // Update 'a'
    cache.put("a", 10);
    
    assert(cache.get("a") === 10, "Test 3a: Updated value for 'a' is 10");
    assert(cache.get("b") === 2, "Test 3b: 'b' is still present");
    assert(cache.size === 2, "Test 3c: Size remains 2");
    
    // Add 'c', should evict 'b' (since 'a' was just updated/moved to front)
    cache.put("c", 3);
    assert(cache.get("b") === null, "Test 3d: 'b' was evicted after 'a' update");
    assert(cache.get("c") === 3, "Test 3e: 'c' is present");
    console.log("");
  }

  // Test 4: Capacity 1
  {
    const cache = new LRUCacheImpl<string, number>(1);
    cache.put("a", 1);
    assert(cache.get("a") === 1, "Test 4a: Get 'a' returns 1");
    
    cache.put("b", 2);
    assert(cache.get("a") === null, "Test 4b: 'a' was evicted");
    assert(cache.get("b") === 2, "Test 4c: 'b' is present");
    assert(cache.size === 1, "Test 4d: Size is 1");
    console.log("");
  }

  // Test 5: Invalid Capacity
  {
    let threw = false;
    try {
      new LRUCacheImpl<string, number>(0);
    } catch (e) {
      threw = true;
    }
    assert(threw, "Test 5a: Constructor throws for capacity 0");
    
    threw = false;
    try {
      new LRUCacheImpl<string, number>(-1);
    } catch (e) {
      threw = true;
    }
    assert(threw, "Test 5b: Constructor throws for negative capacity");
    console.log("");
  }

  // Test 6: Complex Sequence
  {
    const cache = new LRUCacheImpl<number, string>(3);
    cache.put(1, "one");
    cache.put(2, "two");
    cache.put(3, "three");
    
    // Access 1, making it MRU
    cache.get(1);
    
    // Add 4, evicts 2 (LRU)
    cache.put(4, "four");
    
    assert(cache.get(1) === "one", "Test 6a: 1 is present");
    assert(cache.get(2) === null, "Test 6b: 2 was evicted");
    assert(cache.get(3) === "three", "Test 6c: 3 is present");
    assert(cache.get(4) === "four", "Test 6d: 4 is present");
    
    // Access 3, making it MRU
    cache.get(3);
    
    // Add 5, evicts 1 (LRU)
    cache.put(5, "five");
    
    assert(cache.get(1) === null, "Test 6e: 1 was evicted");
    assert(cache.get(3) === "three", "Test 6f: 3 is present");
    assert(cache.get(4) === "four", "Test 6g: 4 is present");
    assert(cache.get(5) === "five", "Test 6h: 5 is present");
    console.log("");
  }

  // Test 7: Verify Interface Compliance
  {
    const cache: LRUCache<string, number> = new LRUCacheImpl<string, number>(2);
    cache.put("x", 100);
    assert(cache.get("x") === 100, "Test 7a: Interface compliance - get works");
    assert(cache.capacity === 2, "Test 7b: Interface compliance - capacity getter works");
    assert(cache.size === 1, "Test 7c: Interface compliance - size getter works");
    console.log("");
  }

  console.log("All tests passed successfully!");
}

/**
 * Demonstrates the LRU Cache with a simple usage example.
 */
function runDemo(): void {
  console.log("\n--- LRU Cache Demo ---");
  const cache = new LRUCacheImpl<string, number>(3);
  
  console.log("Initial state: Empty cache, capacity 3");
  
  cache.put("apple", 1);
  console.log(`Put apple=1. Size: ${cache.size}`);
  
  cache.put("banana", 2);
  console.log(`Put banana=2. Size: ${cache.size}`);
  
  cache.put("cherry", 3);
  console.log(`Put cherry=3. Size: ${cache.size}`);
  
  console.log(`Get apple: ${cache.get("apple")}`); // MRU: apple
  console.log(`Get banana: ${cache.get("banana")}`); // MRU: banana
  
  cache.put("date", 4);
  console.log(`Put date=4. Evicts cherry (LRU). Size: ${cache.size}`);
  
  console.log(`Get cherry: ${cache.get("cherry")}`); // Should be null
  console.log(`Get date: ${cache.get("date")}`); // Should be 4
  
  console.log("--- Demo Complete ---\n");
}

// Main execution
if (require.main === module) {
  runTests();
  runDemo();
}
