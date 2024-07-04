type TrieResult = {
  originalWord?: string;
  frequency: number;
};

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function orderByFrequency(a: TrieResult, b: TrieResult) {
  return b.frequency - a.frequency;
}

function cleanText(text: string) {
  return text
    .replace(/[\(\[\{<].*?[\)\]\}>]/g, "") // Remove words between brackets
    .replace(/[^a-zA-Z0-9À-ỹ\s]/g, "") // Remove special characters but keep Vietnamese characters
    .replace(/\b\S*[^a-zA-ZÀ-ỹ\s]+\S*\b/g, "") // Remove words with numbers or special characters
    .replace(/\s+/g, " ") // Remove extra spaces
    .trim(); // Remove leading and trailing spaces
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
    for (let char of word) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }

  insert(word: string) {
    let node = this.root;
    for (let char of word) {
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
    for (let char of prefix) {
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
    for (const char in Object.fromEntries(node.children)) {
      const child = node.children.get(char)!;
      results = results.concat(this._findAllWords(child));
    }
    return results;
  }
}

export class VietnameseSearchTrie {
  trie: Trie;
  constructor() {
    this.trie = new Trie();
  }

  addWord(word: string) {
    if (!this.trie.has(word.toLowerCase())) {
      this.trie.insert(word.toLowerCase());
    }
  }

  search(query: string, limit = 10) {
    return this.trie
      .search(query.toLowerCase())
      .sort(orderByFrequency)
      .slice(0, limit) // from 0 to limit
      .map((r) => r.originalWord);
  }
}
