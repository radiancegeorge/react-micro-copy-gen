import React from 'react';
import Card from '../../components/generalCard';
import Note from '../../assets/images/Group 1255.png';
import Book from '../../assets/images/Group 1256.png';
import Lamp from '../../assets/images/Group 1257.png';
import Mic from '../../assets/images/Group 1258.png';
import LanguageIcon from '../../assets/svg/englishIcon';
import SelectArrowIcon from '../../assets/svg/selectLangArrow';
import {
  Container,
  CardWrapper,
  CardHeader,
  CardTitle,
  CardIcon,
  CardBody,
  WordMeaning,
  WordHeader,
  GeneralTabWordMeaningContent,
} from './style';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
const cardProps = [
  {
    title: 'Speech Rate',
    icon: Note,
    content: 'Track your speech rate to see how well you’re doing.',
    percentage: '195 (wpm)',
  },
  {
    title: 'Audibility',
    icon: Book,
    content: 'Gauge how loudly you project your voice while speaking.',
    percentage: '79 (Decibel level)',
  },
  {
    title: 'Intelligibility Score',
    icon: Lamp,
    content: 'See the reference text your provided for your recording.',
    percentage: '80%',
  },
  {
    title: 'Hypothesis',
    icon: Note,
    content: 'Check if you’re getting the tone right when you speak.',
    percentage: '95%',
  },
  {
    title: 'What We Heard',
    icon: Mic,
    content: 'Provided by AI',
    // percentage: 44,
  },
  {
    title: 'What We Heard',
    icon: Mic,
    content: 'Provided by AI',
    // percentage: 80,
  },
];
function CardContainer({ setGeneralTab }) {
  const { findText } = useTranslation(wordStore);
  const meaningArry = ['Noum', 'Verb', 'Noun'];
  return (
    <div>
      <CardWrapper>
        <CardHeader>
          <CardTitle>{findText('Word Translation')}</CardTitle>
          <div className="lang">
            <LanguageIcon />
            <p>{findText('English')}</p>
            <SelectArrowIcon />
          </div>
        </CardHeader>
        <CardBody>{findText('Communication')}</CardBody>
      </CardWrapper>
      <Container>
        {cardProps.map((props, index) => (
          <Card key={index} {...props} />
        ))}
      </Container>
      <WordMeaning>
        <WordHeader>
          <p>{findText('Word meaning')}</p>
          <div className="lang">
            <LanguageIcon />
            <p>{findText('English')}</p>
            <SelectArrowIcon />
          </div>
        </WordHeader>
        <GeneralTabWordMeaningContent>
          {meaningArry.map((item, idx) => (
            <li key={idx}>
              <p>
                <span>{idx + 1}.</span> Part of speech:{' '}
                <span className="em">{item}</span>
              </p>
              <p>
                The imparting or exchanging of information by speaking, writing,
                or using some other medium.
              </p>
              <div>
                <span>Example(s):</span>
                <div>
                  <p>
                    He is studying insect <span>communication.</span>
                  </p>
                  <p>
                    He is studying insect <span>communication.</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </GeneralTabWordMeaningContent>
      </WordMeaning>
    </div>
  );
}
export default CardContainer;
