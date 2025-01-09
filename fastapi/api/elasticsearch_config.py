from elasticsearch import AsyncElasticsearch
import logging
from typing import Dict, List, Optional

class ESClient:
    def __init__(self, elasticsearch_url: str):
        self.client = AsyncElasticsearch([elasticsearch_url])
        self.index_name = "teaching_plans"
        
    async def init_index(self):
        """初始化索引配置"""
        settings = {
            "analysis": {
                "analyzer": {
                    "custom_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "stop"]
                    }
                }
            }
        }
        
        mappings = {
            "properties": {
                "tp_name": {"type": "text", "analyzer": "custom_analyzer"},
                "writer_name": {"type": "keyword"},
                "team": {"type": "keyword"},
                "semester": {"type": "keyword"},
                "category": {"type": "keyword"},
                "grade": {"type": "keyword"},
                "objectives": {"type": "text", "analyzer": "custom_analyzer"},
                "outline": {"type": "text", "analyzer": "custom_analyzer"},
                "content": {"type": "text", "analyzer": "custom_analyzer"},
                "text_chunks": {
                    "type": "text",
                    "analyzer": "custom_analyzer"
                },
                "embeddings": {
                    "type": "dense_vector",
                    "dims": 384  # MiniLM-L12 輸出維度
                }
            }
        }

        index_exists = await self.client.indices.exists(index=self.index_name)
        if not index_exists:
            await self.client.indices.create(
                index=self.index_name,
                settings=settings,
                mappings=mappings
            )
            logging.info(f"Created index {self.index_name}")

    async def index_teaching_plan(self, 
                                teaching_plan: Dict, 
                                search_content: Optional[Dict] = None,
                                embeddings_data: Optional[Dict] = None):
        """索引教案文檔與向量"""
        doc = {
            "tp_name": teaching_plan["tp_name"],
            "writer_name": teaching_plan["writer_name"],
            "team": teaching_plan["team"],
            "semester": teaching_plan["semester"],
            "category": teaching_plan["category"],
            "grade": teaching_plan["grade"],
            "objectives": teaching_plan["objectives"],
            "outline": teaching_plan["outline"]
        }
        
        if search_content:
            doc["content"] = search_content["content"]
            
        if embeddings_data:
            # 確保每個文本塊和對應的向量以正確的格式儲存
            docs = []
            for chunk, embedding in zip(embeddings_data["chunks"], embeddings_data["embeddings"]):
                chunk_doc = doc.copy()
                chunk_doc["text_chunks"] = chunk
                chunk_doc["embeddings"] = embedding  # 確保 embedding 是一個一維數組
                docs.append(chunk_doc)
            
            # 批量索引文檔
            body = []
            for i, chunk_doc in enumerate(docs):
                body.extend([
                    {"index": {"_index": self.index_name, "_id": f"{teaching_plan['id']}_{i}"}},
                    chunk_doc
                ])
            
            await self.client.bulk(operations=body)
        else:
            # 如果沒有 embeddings，就只索引基本文檔
            await self.client.index(
                index=self.index_name,
                id=teaching_plan["id"],
                document=doc
            )
    
    async def search(self, query: Dict, filters: Optional[Dict] = None) -> List[Dict]:
        """
        搜尋教案
        :param query: 搜尋查詢
        :param filters: 過濾條件
        :return: 搜尋結果列表
        """
        search_body = {
            "query": {
                "bool": {
                    "must": [query]
                }
            }
        }

        # 如果有過濾條件，加入到查詢中
        if filters:
            search_body["query"]["bool"]["filter"] = []
            for field, value in filters.dict().items():
                if value:
                    if isinstance(value, list):
                        search_body["query"]["bool"]["filter"].append(
                            {"terms": {field: value}}
                        )
                    else:
                        search_body["query"]["bool"]["filter"].append(
                            {"term": {field: value}}
                        )
        search_body["query"]["bool"]["must"] = []
        
        try:
            response = await self.client.search(
                index=self.index_name,
                body=search_body,
                size=100  # 可以根據需要調整返回的結果數量
            )
            return response
        except Exception as e:
            logging.error(f"Search error: {str(e)}")
            raise

    async def vector_search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        """
        向量搜尋
        :param query_vector: 查詢向量
        :param top_k: 返回的結果數量
        :return: 最相似的文檔列表
        """
        search_body = {
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embeddings') + 1.0",
                        "params": {"query_vector": query_vector}
                    }
                }
            },
            "size": top_k
        }

        try:
            response = await self.client.search(
                index=self.index_name,
                body=search_body
            )
            hits = response["hits"]["hits"]
            return [hit["_source"] for hit in hits]
        except Exception as e:
            logging.error(f"Vector search error: {str(e)}")
            raise