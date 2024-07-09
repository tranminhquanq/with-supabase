import levenshtein from "js-levenshtein";

type TrieResult = {
  originalWord?: string;
  frequency: number;
};

function orderByFrequency(a: TrieResult, b: TrieResult) {
  return b.frequency - a.frequency;
}

class TrieNode {
  children = new Map<string, TrieNode>();
  isEndOfWord = false;
  frequency = 0;
  originalWord?: string;
}

class Trie {
  root: TrieNode;
  constructor() {
    this.root = new TrieNode();
  }

  has(word: string) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }

  insert(word: string) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.frequency++;
    }
    node.isEndOfWord = true;
    node.originalWord = word;
  }

  search(prefix: string) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    return this._findAllWords(node).map((result) => result);
  }

  _findAllWords(node: TrieNode): Array<TrieResult> {
    let results: Array<TrieResult> = [];
    if (node.isEndOfWord) {
      results.push({
        originalWord: node.originalWord,
        frequency: node.frequency,
      });
    }
    node.children.forEach((child) => {
      results = results.concat(this._findAllWords(child));
    });
    return results;
  }

  fuzzySearch(query: string, maxDistance = 1) {
    const results: Array<TrieResult> = [];
    this._traverse(this.root, "", query, maxDistance, results);
    return results;
  }

  _traverse(
    node: TrieNode,
    currentWord: string,
    query: string,
    maxDistance: number,
    results: Array<TrieResult>
  ) {
    if (currentWord.length > 0) {
      const queryWords = query.split(" ");
      const currentWords = currentWord.split(" ");
      const minLength = Math.min(queryWords.length, currentWords.length);
      let partialDistance = 0;
      for (let i = 0; i < minLength; i++) {
        partialDistance += levenshtein(queryWords[i], currentWords[i]);
      }

      if (partialDistance <= maxDistance && node.isEndOfWord) {
        results.push({
          originalWord: node.originalWord,
          frequency: node.frequency,
        });
      }
    }
    node.children.forEach((child, char) => {
      this._traverse(child, currentWord + char, query, maxDistance, results);
    });
  }
}

export class AutocompleteSearchTrie {
  trie: Trie;
  constructor() {
    this.trie = new Trie();
  }

  addWord(word: string) {
    this.trie.insert(word.toLowerCase());
  }

  search({
    query,
    limit = 5,
    isFuzzy = false,
  }: {
    query: string;
    limit?: number;
    isFuzzy?: boolean;
  }) {
    let results = this.trie.search(query.toLowerCase());
    if (results.length < limit && isFuzzy) {
      results = this.trie.fuzzySearch(query.toLowerCase());
    }

    return results
      .sort(orderByFrequency)
      .slice(0, limit) // from 0 to limit
      .map((r) => r.originalWord);
  }
}
